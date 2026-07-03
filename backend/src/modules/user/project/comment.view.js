export const commentView = {
  formatComment(row) {
    return {
      id: row.id,
      projectId: row.project_id,
      userId: row.user_id,
      userName: row.user_name,
      tiptapCommentId: row.tiptap_comment_id,
      commentText: row.comment_text,
      lineNumber: row.line_number,
      columnOffset: row.column_offset,
      isResolved: row.is_resolved,
      createdAt: row.created_at,
    };
  },

  formatCommentList(rows) {
    return rows.map((row) => commentView.formatComment(row));
  },
};
