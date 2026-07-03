export const libraryView = {
  formatSource(row) {
    return {
      id: row.id,
      sourceType: row.source_type,
      title: row.title,
      authors: row.authors,
      authorFirstName: row.author_first_name,
      authorLastName: row.author_last_name,
      publisher: row.publisher,
      publicationPlace: row.publication_place,
      publicationYear: row.publication_year,
      volume: row.volume,
      issue: row.issue,
      pages: row.pages,
      googleDriveFileId: row.google_drive_file_id ?? null,
      hasPdf: Boolean(row.google_drive_file_id),
      createdAt: row.created_at,
    };
  },

  formatSourceList(rows) {
    return rows.map((row) => libraryView.formatSource(row));
  },
};
