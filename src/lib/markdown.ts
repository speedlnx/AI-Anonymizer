/**
 * Zero-dependency, safe Markdown to HTML parser for AI responses.
 * Compiles cleanly without requiring external npm packages.
 * Supports:
 * - Headers (# H1 to ###### H6)
 * - Fenced code blocks with optional language tags (```lang ... ```)
 * - Inline code (`code`)
 * - Bold (**text** or __text__) and Italic (*text* or _text_)
 * - Strikethrough (~~text~~)
 * - Blockquotes (> quote)
 * - Unordered lists (* or -) and Ordered lists (1. 2.)
 * - Tables (| Header 1 | Header 2 |) with auto header/body detection
 * - Links ([text](url)) with secure target="_blank" rel="noopener noreferrer"
 * - Horizontal rules (---, ***)
 * - Paragraphs and line breaks
 * - Full XSS escaping for non-markdown HTML tags
 */

export function renderMarkdownToHtml(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return '';

  // Escape HTML entities to prevent XSS
  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  // 1. Extract fenced code blocks (```lang\n...\n```) to preserve raw code
  const codeBlocks: string[] = [];
  let text = markdown.replace(/```([a-zA-Z0-9_-]*)\r?\n([\s\S]*?)```/g, (_, lang, code) => {
    const escapedCode = escapeHtml(code.trimEnd());
    const langAttr = lang ? ` class="language-${escapeHtml(lang)}"` : '';
    const index = codeBlocks.length;
    codeBlocks.push(`<pre><code${langAttr}>${escapedCode}</code></pre>`);
    return `\n@@CODEBLOCK${index}@@\n`;
  });

  // 2. Extract inline code (`code`)
  const inlineCodes: string[] = [];
  text = text.replace(/`([^`\r\n]+)`/g, (_, code) => {
    const index = inlineCodes.length;
    inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
    return `@@INLINECODE${index}@@`;
  });

  const lines = text.split(/\r?\n/);
  const output: string[] = [];
  let inList: 'ul' | 'ol' | null = null;
  let inBlockquote = false;
  let inTable = false;
  let tableHeaderDone = false;

  const closeList = () => {
    if (inList) {
      output.push(inList === 'ul' ? '</ul>' : '</ol>');
      inList = null;
    }
  };

  const closeBlockquote = () => {
    if (inBlockquote) {
      output.push('</blockquote>');
      inBlockquote = false;
    }
  };

  const closeTable = () => {
    if (inTable) {
      output.push('</tbody></table>');
      inTable = false;
      tableHeaderDone = false;
    }
  };

  const closeAllBlocks = () => {
    closeList();
    closeBlockquote();
    closeTable();
  };

  // Helper for inline formatting (bold, italic, strikethrough, links)
  const formatInline = (inline: string): string => {
    let s = inline;
    // Bold & italic
    s = s.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    s = s.replace(/_([^_]+)_/g, '<em>$1</em>');
    // Strikethrough
    s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    // Markdown Links [text](url) - only http/https/mailto allowed for safety
    s = s.replace(
      /\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    return s;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for code block placeholder
    if (trimmed.startsWith('@@CODEBLOCK') && trimmed.endsWith('@@')) {
      closeAllBlocks();
      output.push(trimmed);
      continue;
    }

    // Blank line
    if (!trimmed) {
      closeAllBlocks();
      continue;
    }

    // Horizontal Rule
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      closeAllBlocks();
      output.push('<hr />');
      continue;
    }

    // Headers (# H1 to ###### H6)
    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      closeAllBlocks();
      const level = headerMatch[1].length;
      const content = formatInline(escapeHtml(headerMatch[2]));
      output.push(`<h${level}>${content}</h${level}>`);
      continue;
    }

    // Blockquote (> Quote)
    const bqMatch = line.match(/^>\s?(.*)$/);
    if (bqMatch) {
      closeList();
      closeTable();
      if (!inBlockquote) {
        output.push('<blockquote>');
        inBlockquote = true;
      }
      output.push(`<p>${formatInline(escapeHtml(bqMatch[1]))}</p>`);
      continue;
    } else {
      closeBlockquote();
    }

    // Table rows (| col 1 | col 2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
      closeList();
      closeBlockquote();

      // Check for table header separator (|:---:|---|)
      const isSeparator = /^\|(\s*:?-+:?\s*\|)+$/.test(trimmed);
      if (isSeparator) {
        tableHeaderDone = true;
        continue;
      }

      const rawCells = trimmed.slice(1, -1).split('|');
      const cells = rawCells.map((c) => c.trim());

      if (!inTable) {
        inTable = true;
        tableHeaderDone = false;
        output.push('<table><thead><tr>');
        for (const cell of cells) {
          output.push(`<th>${formatInline(escapeHtml(cell))}</th>`);
        }
        output.push('</tr></thead><tbody>');
      } else {
        output.push('<tr>');
        const tag = tableHeaderDone ? 'td' : 'th';
        for (const cell of cells) {
          output.push(`<${tag}>${formatInline(escapeHtml(cell))}</${tag}>`);
        }
        output.push('</tr>');
      }
      continue;
    } else {
      closeTable();
    }

    // Unordered list item (*, -)
    const ulMatch = line.match(/^(\s*)[*-]\s+(.*)$/);
    if (ulMatch) {
      closeTable();
      closeBlockquote();
      if (inList !== 'ul') {
        closeList();
        inList = 'ul';
        output.push('<ul>');
      }
      output.push(`<li>${formatInline(escapeHtml(ulMatch[2]))}</li>`);
      continue;
    }

    // Ordered list item (1., 2.)
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (olMatch) {
      closeTable();
      closeBlockquote();
      if (inList !== 'ol') {
        closeList();
        inList = 'ol';
        output.push('<ol>');
      }
      output.push(`<li>${formatInline(escapeHtml(olMatch[2]))}</li>`);
      continue;
    }

    // Regular text paragraph
    closeAllBlocks();
    output.push(`<p>${formatInline(escapeHtml(line))}</p>`);
  }

  closeAllBlocks();

  let finalHtml = output.join('\n');

  // Restore inline codes
  finalHtml = finalHtml.replace(
    /@@INLINECODE(\d+)@@/g,
    (_, idx) => inlineCodes[Number(idx)] || ''
  );

  // Restore code blocks
  finalHtml = finalHtml.replace(
    /@@CODEBLOCK(\d+)@@/g,
    (_, idx) => codeBlocks[Number(idx)] || ''
  );

  return finalHtml;
}
