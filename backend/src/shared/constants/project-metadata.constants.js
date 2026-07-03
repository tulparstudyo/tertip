export const THESIS_LEVELS = [
  'Yüksek Lisans',
  'Doktora',
  'Tıpta Uzmanlık',
  'Sanatta Yeterlik',
];

export const PROJECT_METADATA_FIELDS = {
  thesis: [
    { key: 'university', required: true },
    { key: 'institute', required: true },
    { key: 'department', required: true },
    { key: 'thesisLevel', required: true },
    { key: 'thesisTitle', required: true },
    { key: 'authorName', required: true },
    { key: 'studentNumber', required: true },
    { key: 'advisor', required: true },
    { key: 'city', required: true },
    { key: 'year', required: true },
  ],
};

export function pickProjectMetadata(projectType, raw = {}) {
  const fields = PROJECT_METADATA_FIELDS[projectType] ?? [];
  const metadata = {};

  for (const field of fields) {
    const value = raw[field.key];
    metadata[field.key] = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
  }

  return metadata;
}

export function validateProjectMetadata(projectType, metadata) {
  const fields = PROJECT_METADATA_FIELDS[projectType] ?? [];

  for (const field of fields) {
    if (field.required && !metadata[field.key]) {
      return { valid: false, field: field.key };
    }
  }

  if (projectType === 'thesis' && metadata.thesisLevel && !THESIS_LEVELS.includes(metadata.thesisLevel)) {
    return { valid: false, field: 'thesisLevel' };
  }

  return { valid: true };
}

export function getProjectContext(projectRow) {
  return {
    title: projectRow?.title ?? '',
    projectType: projectRow?.project_type ?? 'article',
    metadata: projectRow?.metadata ?? {},
  };
}
