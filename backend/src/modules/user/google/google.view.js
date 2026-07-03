export const googleView = {
  formatStatus(tokenData, verification = null) {
    const hasToken = Boolean(tokenData?.refresh_token);
    const verified = verification?.verified ?? hasToken;
    const connected = verification ? verification.connected && verified : hasToken;
    const needsReconnect = hasToken && !verified;

    return {
      connected,
      verified,
      needsReconnect,
      reason: verification?.reason ?? null,
      libraryFolderId: tokenData?.library_folder_id ?? null,
      scopes: tokenData?.scope?.split(' ') ?? [],
    };
  },
};
