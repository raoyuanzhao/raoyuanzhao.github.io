import type { BibTeXInlineNode } from '@/types/publication';

const commandTypes: Record<string, Exclude<BibTeXInlineNode['type'], 'text'>> = {
  emph: 'em',
  textit: 'em',
  textbf: 'strong',
  textsc: 'smallCaps',
  textsuperscript: 'sup',
  textsubscript: 'sub',
};

const accentMarks: Record<string, string> = {
  '"': '\u0308',
  "'": '\u0301',
  '`': '\u0300',
  '^': '\u0302',
  '~': '\u0303',
  '=': '\u0304',
  '.': '\u0307',
  u: '\u0306',
  v: '\u030C',
  H: '\u030B',
  c: '\u0327',
  k: '\u0328',
  r: '\u030A',
};

const specialLetters: Record<string, string> = {
  ss: 'ß',
  o: 'ø',
  O: 'Ø',
  ae: 'æ',
  AE: 'Æ',
  oe: 'œ',
  OE: 'Œ',
  aa: 'å',
  AA: 'Å',
  l: 'ł',
  L: 'Ł',
  i: 'ı',
  j: 'ȷ',
  '&': '&',
  '%': '%',
  '$': '$',
  '#': '#',
  '_': '_',
};

interface ParseResult {
  nodes: BibTeXInlineNode[];
  index: number;
}

export interface ParsedBibTeXInline {
  plainText: string;
  nodes: BibTeXInlineNode[];
}

function normalizeBibTeXInput(value: string): string {
  return value.replace(/^["']|["']$/g, '');
}

function pushText(nodes: BibTeXInlineNode[], text: string) {
  if (!text) return;

  const last = nodes[nodes.length - 1];
  if (last?.type === 'text') {
    last.text += text;
    return;
  }

  nodes.push({ type: 'text', text });
}

function readCommand(value: string, index: number): { command: string; index: number } {
  let cursor = index;
  let command = '';

  while (cursor < value.length && /[A-Za-z]/.test(value[cursor])) {
    command += value[cursor];
    cursor += 1;
  }

  if (!command && cursor < value.length) {
    command = value[cursor];
    cursor += 1;
  }

  return { command, index: cursor };
}

function parseGroup(value: string, index: number): ParseResult | null {
  if (value[index] !== '{') {
    return null;
  }

  return parseNodes(value, index + 1, true);
}

function parseNodes(value: string, startIndex: number, stopAtBrace: boolean): ParseResult {
  const nodes: BibTeXInlineNode[] = [];
  let index = startIndex;

  while (index < value.length) {
    const char = value[index];

    if (char === '}' && stopAtBrace) {
      return { nodes, index: index + 1 };
    }

    if (char === '{') {
      const parsedGroup = parseGroup(value, index);
      if (parsedGroup) {
        parsedGroup.nodes.forEach((node) => (node.type === 'text' ? pushText(nodes, node.text) : nodes.push(node)));
        index = parsedGroup.index;
        continue;
      }
    }

    if (char === '\\') {
      const { command, index: afterCommand } = readCommand(value, index + 1);

      if (command === 'cite') {
        const citationGroup = parseGroup(value, afterCommand);
        index = citationGroup?.index ?? afterCommand;
        continue;
      }

      const accentMark = accentMarks[command];
      if (accentMark) {
        let cursor = afterCommand;
        while (/[A-Za-z]/.test(command) && value[cursor] === ' ') cursor += 1;

        let base = '';
        if (value[cursor] === '{') {
          const group = parseGroup(value, cursor);
          base = group ? flattenBibTeXInlineNodes(group.nodes) : '';
          cursor = group?.index ?? cursor + 1;
        } else if (value[cursor] === '\\') {
          const nested = readCommand(value, cursor + 1);
          base = specialLetters[nested.command] ?? nested.command;
          cursor = nested.index;
        } else if (cursor < value.length) {
          base = value[cursor];
          cursor += 1;
        }

        pushText(nodes, base ? `${base.slice(0, 1)}${accentMark}${base.slice(1)}`.normalize('NFC') : '');
        index = cursor;
        continue;
      }

      const special = specialLetters[command];
      if (special) {
        pushText(nodes, special);
        index = value[afterCommand] === ' ' && /[A-Za-z]/.test(command) ? afterCommand + 1 : afterCommand;
        continue;
      }

      const nodeType = commandTypes[command];
      if (nodeType && value[afterCommand] === '{') {
        const parsedGroup = parseGroup(value, afterCommand);
        if (parsedGroup) {
          nodes.push({ type: nodeType, children: parsedGroup.nodes });
          index = parsedGroup.index;
          continue;
        }
      }

      pushText(nodes, command ? command : '\\');
      index = afterCommand;
      continue;
    }

    if (char === '~') {
      pushText(nodes, ' ');
      index += 1;
      continue;
    }

    pushText(nodes, char);
    index += 1;
  }

  return { nodes, index };
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function flattenBibTeXInlineNodes(nodes: BibTeXInlineNode[]): string {
  return nodes.map((node) => {
    if (node.type === 'text') {
      return node.text;
    }
    return flattenBibTeXInlineNodes(node.children);
  }).join('');
}

export function parseBibTeXInline(value?: string): ParsedBibTeXInline {
  if (!value) {
    return { plainText: '', nodes: [] };
  }

  const parsed = parseNodes(normalizeBibTeXInput(value), 0, false);
  const plainText = compactWhitespace(flattenBibTeXInlineNodes(parsed.nodes));

  return {
    plainText,
    nodes: parsed.nodes,
  };
}
