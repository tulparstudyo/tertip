export const citationImageView = {
  format(row) {
    if (!row) return null;
    return {
      id: row.id,
      projectId: row.project_id,
      sourceId: row.source_id,
      googleDriveFileId: row.google_drive_file_id,
      ocrText: row.ocr_text ?? '',
      citationText: row.citation_text ?? '',
      pageNumber: row.page_number ?? null,
      mimeType: row.mime_type,
      originalFilename: row.original_filename,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
};
