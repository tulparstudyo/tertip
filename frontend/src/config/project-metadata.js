export const THESIS_LEVELS = [
  'Yüksek Lisans',
  'Doktora',
  'Tıpta Uzmanlık',
  'Sanatta Yeterlik',
];

/** Extra fields shown on project create form, keyed by project type */
export const PROJECT_METADATA_FIELDS = {
  thesis: [
    { key: 'university', type: 'text', required: true },
    { key: 'institute', type: 'text', required: true },
    { key: 'department', type: 'text', required: true },
    { key: 'thesisLevel', type: 'select', required: true, options: THESIS_LEVELS },
    { key: 'thesisTitle', type: 'text', required: true },
    { key: 'authorName', type: 'text', required: true },
    { key: 'studentNumber', type: 'text', required: true },
    { key: 'advisor', type: 'text', required: true },
    { key: 'city', type: 'text', required: true },
    { key: 'year', type: 'text', required: true },
  ],
};

export function createEmptyMetadata(projectType, { title = '', authorName = '' } = {}) {
  const fields = PROJECT_METADATA_FIELDS[projectType] ?? [];
  const metadata = {};

  for (const field of fields) {
    if (field.key === 'thesisTitle') {
      metadata[field.key] = title;
    } else if (field.key === 'authorName') {
      metadata[field.key] = authorName;
    } else if (field.key === 'year') {
      metadata[field.key] = String(new Date().getFullYear());
    } else {
      metadata[field.key] = '';
    }
  }

  return metadata;
}

export function getMetadataFields(projectType) {
  return PROJECT_METADATA_FIELDS[projectType] ?? [];
}
