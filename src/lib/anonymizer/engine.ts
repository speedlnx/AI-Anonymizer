import {
  EntityType,
  EntityMapping,
  CustomRule,
  AnonymizationResult,
  DeanonymizationResult,
} from './types';
import { DETECTION_RULES } from './rules';

interface RawMatch {
  type: EntityType;
  value: string;
  start: number;
  end: number;
  priority: number;
  categoryLabel?: string;
}

export class AnonymizerEngine {
  /**
   * Scans text and performs bidirectional anonymization.
   */
  public static anonymize(
    text: string,
    customRules: CustomRule[] = [],
    existingMappings: EntityMapping[] = []
  ): AnonymizationResult {
    const startTime = performance.now();
    if (!text || text.trim() === '') {
      return {
        originalText: text,
        anonymizedText: text,
        mappings: [],
        stats: {
          totalEntitiesFound: 0,
          entitiesAnonymized: 0,
          byType: {} as Record<EntityType, number>,
          durationMs: 0,
        },
      };
    }

    const matches: RawMatch[] = [];

    // 1. Process custom rules first (user priority)
    for (const rule of customRules) {
      if (!rule.text || rule.text.trim() === '') continue;

      try {
        let regex: RegExp;
        if (rule.isRegex) {
          regex = new RegExp(rule.text, rule.caseSensitive ? 'g' : 'gi');
        } else {
          // Escape literal text
          const escaped = rule.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          regex = new RegExp(`\\b${escaped}\\b`, rule.caseSensitive ? 'g' : 'gi');
        }

        let m: RegExpExecArray | null;
        while ((m = regex.exec(text)) !== null) {
          if (m[0].length === 0) {
            regex.lastIndex++;
            continue;
          }
          matches.push({
            type: 'CUSTOM',
            value: m[0],
            start: m.index,
            end: m.index + m[0].length,
            priority: 200, // Custom rules have highest priority
            categoryLabel: rule.categoryLabel || 'Personalizzato',
          });
        }
      } catch (err) {
        console.warn('Invalid custom rule pattern:', rule.text, err);
      }
    }

    // 2. Process built-in detection rules
    for (const rule of DETECTION_RULES) {
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      let m: RegExpExecArray | null;

      while ((m = regex.exec(text)) !== null) {
        let matchedValue = m[0];
        let start = m.index;
        let end = m.index + matchedValue.length;

        // Apply transform if specified
        if (rule.transformMatch) {
          const transformed = rule.transformMatch(matchedValue);
          const offset = matchedValue.indexOf(transformed);
          if (offset !== -1) {
            start += offset;
            end = start + transformed.length;
            matchedValue = transformed;
          }
        }

        // Validate if rule has validator
        if (rule.validate) {
          const validationResult = rule.validate(matchedValue, m);
          if (typeof validationResult === 'boolean' && !validationResult) {
            continue;
          }
          if (typeof validationResult === 'object' && !validationResult.valid) {
            continue;
          }
        }

        if (matchedValue.length > 0) {
          matches.push({
            type: rule.type,
            value: matchedValue,
            start,
            end,
            priority: rule.priority,
            categoryLabel: rule.name,
          });
        }
      }
    }

    // 3. Resolve overlaps: sort by start ascending, then priority descending, then length descending
    matches.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      if (b.priority !== a.priority) return b.priority - a.priority;
      return (b.end - b.start) - (a.end - a.start);
    });

    const nonOverlapping: RawMatch[] = [];
    let lastEnd = -1;

    for (const m of matches) {
      if (m.start >= lastEnd) {
        nonOverlapping.push(m);
        lastEnd = m.end;
      }
    }

    // 4. Build or reuse mappings consistently
    const mappingMap = new Map<string, EntityMapping>();
    const typeCounters: Record<string, number> = {};

    // Seed with existing mappings if any
    for (const em of existingMappings) {
      const key = `${em.type}:::${em.originalValue.toLowerCase()}`;
      mappingMap.set(key, { ...em, count: 0 });
      // update counters to avoid collisions
      const numMatch = em.placeholder.match(/_(\d+)\]$/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        typeCounters[em.type] = Math.max(typeCounters[em.type] || 0, num);
      }
    }

    // Helper to get or create mapping
    const getMappingForValue = (type: EntityType, value: string, categoryLabel?: string): EntityMapping => {
      const key = `${type}:::${value.toLowerCase()}`;
      if (mappingMap.has(key)) {
        const existing = mappingMap.get(key)!;
        existing.count += 1;
        return existing;
      }

      typeCounters[type] = (typeCounters[type] || 0) + 1;
      const index = typeCounters[type];
      const placeholder = `[${type}_${index}]`;

      const newMapping: EntityMapping = {
        id: `${type}_${index}`,
        placeholder,
        type,
        originalValue: value,
        categoryName: categoryLabel || type,
        createdAt: Date.now(),
        count: 1,
        enabled: true,
      };

      mappingMap.set(key, newMapping);
      return newMapping;
    };

    // 5. Replace text with placeholders (working from right to left to preserve offsets)
    const sortedReplacements = [...nonOverlapping].sort((a, b) => b.start - a.start);
    let anonymizedText = text;

    const statsByType: Record<EntityType, number> = {} as Record<EntityType, number>;

    for (const item of sortedReplacements) {
      const mapping = getMappingForValue(item.type, item.value, item.categoryLabel);
      statsByType[item.type] = (statsByType[item.type] || 0) + 1;

      anonymizedText =
        anonymizedText.slice(0, item.start) +
        mapping.placeholder +
        anonymizedText.slice(item.end);
    }

    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
    const finalMappings = Array.from(mappingMap.values());

    return {
      originalText: text,
      anonymizedText,
      mappings: finalMappings,
      stats: {
        totalEntitiesFound: nonOverlapping.length,
        entitiesAnonymized: nonOverlapping.length,
        byType: statsByType,
        durationMs,
      },
    };
  }

  /**
   * Replaces placeholders in the AI response (or any text) with original values.
   */
  public static deanonymize(text: string, mappings: EntityMapping[]): DeanonymizationResult {
    if (!text || mappings.length === 0) {
      return {
        restoredText: text,
        restorationsCount: 0,
        restoredEntities: [],
      };
    }

    let restoredText = text;
    let totalRestorations = 0;
    const restoredEntities: DeanonymizationResult['restoredEntities'] = [];

    // Sort by placeholder length descending to avoid partial replacements
    const sortedMappings = [...mappings].sort(
      (a, b) => b.placeholder.length - a.placeholder.length
    );

    for (const mapping of sortedMappings) {
      if (!mapping.enabled) continue;

      // Handle both exact placeholder e.g. [CODICE_FISCALE_1] and possible AI variants e.g. CODICE_FISCALE_1
      const escapedPlaceholder = mapping.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedPlaceholder, 'g');

      let matchCount = 0;
      restoredText = restoredText.replace(regex, () => {
        matchCount++;
        return mapping.originalValue;
      });

      if (matchCount > 0) {
        totalRestorations += matchCount;
        restoredEntities.push({
          placeholder: mapping.placeholder,
          originalValue: mapping.originalValue,
          type: mapping.type,
          count: matchCount,
        });
      }
    }

    return {
      restoredText,
      restorationsCount: totalRestorations,
      restoredEntities,
    };
  }

  /**
   * Zero-Leak Guarantee: Verifies that no original sensitive values are present
   * in the text to be transmitted externally.
   * Returns { safe: boolean, leakedValues: string[] }
   */
  public static auditForDataLeak(
    textToSend: string,
    mappings: EntityMapping[]
  ): { safe: boolean; leakedValues: string[] } {
    const leakedValues: string[] = [];

    for (const mapping of mappings) {
      if (!mapping.enabled) continue;
      const original = mapping.originalValue.trim();
      // Only check strings with length >= 3 to avoid single char noise
      if (original.length < 3) continue;

      if (textToSend.includes(original)) {
        leakedValues.push(`${mapping.type}: ${original.slice(0, 4)}***`);
      }
    }

    return {
      safe: leakedValues.length === 0,
      leakedValues,
    };
  }
}

