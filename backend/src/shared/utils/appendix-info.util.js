export function formatAppendixInfoLabel(number, title) {
  const n = Number(number) || 1;
  const text = String(title ?? '').trim();
  return text ? `EK-${n}: ${text}` : `EK-${n}`;
}

export function collectAppendixInfosFromDoc(doc) {
  const items = [];

  function walk(nodes) {
    for (const node of nodes ?? []) {
      if (node.type === 'appendixInfo') {
        const title = String(node.attrs?.title ?? '').trim();
        if (title) {
          items.push({
            appendixInfoId: node.attrs?.appendixInfoId ?? '',
            number: Number(node.attrs?.number) || items.length + 1,
            title,
          });
        }
      }
      if (node.content) walk(node.content);
    }
  }

  walk(doc?.content);
  return items;
}

export function buildEklerDocFromAppendixInfos(infos) {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1, textAlign: 'center' },
        content: [{ type: 'text', text: 'EKLER', marks: [{ type: 'bold' }] }],
      },
      ...infos.map((info, index) => ({
        type: 'appendixEntry',
        attrs: {
          number: index + 1,
          title: info.title,
          page: '',
        },
      })),
    ],
  };
}
