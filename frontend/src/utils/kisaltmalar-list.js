function toUpperTr(text) {
  return text?.toLocaleUpperCase('tr-TR') ?? '';
}

const BOLD_MARK = [{ type: 'bold' }];

function kisaltmalarTableCell(text) {
  return {
    type: 'tableCell',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text, marks: BOLD_MARK }],
      },
    ],
  };
}

export function buildKisaltmalarTable(rows) {
  return {
    type: 'table',
    content: rows.map(({ abbreviation, definition }) => ({
      type: 'tableRow',
      content: [
        kisaltmalarTableCell(abbreviation),
        kisaltmalarTableCell(' : '),
        kisaltmalarTableCell(definition),
      ],
    })),
  };
}

export function buildKisaltmalarListesiDoc({ title = 'KISALTMALAR LİSTESİ', items = [] } = {}) {
  const normalizedTitle = toUpperTr(title) || 'KISALTMALAR LİSTESİ';
  const rows = items
    .map((item) => ({
      abbreviation: String(item?.abbreviation ?? '').trim(),
      definition: String(item?.definition ?? '').trim(),
    }))
    .filter((item) => item.abbreviation && item.definition);

  const content = [
    {
      type: 'heading',
      attrs: { level: 1, textAlign: 'center' },
      content: [{ type: 'text', text: normalizedTitle, marks: BOLD_MARK }],
    },
  ];

  if (rows.length > 0) {
    content.push(buildKisaltmalarTable(rows));
  }

  return { type: 'doc', content };
}

export function centeredKisaltmalarTitle() {
  return {
    type: 'heading',
    attrs: { level: 1, textAlign: 'center' },
    content: [
      {
        type: 'text',
        text: 'KISALTMALAR LİSTESİ',
        marks: BOLD_MARK,
      },
    ],
  };
}
