import { Readable } from 'stream';
import { google } from 'googleapis';
import { createOAuth2Client, GOOGLE_SCOPES } from './google-oauth.service.js';
import { googleModel } from '../../modules/user/google/google.model.js';
import {
  hasRequiredGoogleScopes,
  isInvalidGrantError,
  isGoogleNetworkError,
  mergeStoredOAuthToken,
  pickOAuthCredentials,
} from '../utils/google-token.util.js';

const LIBRARY_PATH = ['Tertip', 'Library'];
const PROJECTS_PATH = ['Tertip', 'Projects'];

const userRefreshChains = new Map();

function withUserRefreshLock(userId, task) {
  const previous = userRefreshChains.get(userId) ?? Promise.resolve();
  const run = previous.catch(() => {}).then(task);
  userRefreshChains.set(
    userId,
    run.finally(() => {
      if (userRefreshChains.get(userId) === run) {
        userRefreshChains.delete(userId);
      }
    }),
  );
  return run;
}

function isAccessTokenFresh(credentials, bufferMs = 120_000) {
  if (!credentials.access_token) return false;
  if (!credentials.expiry_date) return true;
  return credentials.expiry_date > Date.now() + bufferMs;
}

async function ensureAccessToken(client, userId, credentials) {
  if (isAccessTokenFresh(credentials)) return;

  await withUserRefreshLock(userId, async () => {
    const latest = await googleModel.getOAuthToken(userId);
    const latestCredentials = pickOAuthCredentials(latest ?? credentials);
    client.setCredentials(latestCredentials);

    if (isAccessTokenFresh(latestCredentials)) return;

    let lastErr;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const { token } = await client.getAccessToken();
        if (!token) {
          const err = new Error('GOOGLE_NOT_CONNECTED');
          err.status = 400;
          throw err;
        }
        return;
      } catch (err) {
        lastErr = err;
        if (isInvalidGrantError(err)) {
          await googleModel.clearOAuthToken(userId);
          const revoked = new Error('GOOGLE_TOKEN_REVOKED');
          revoked.status = 401;
          throw revoked;
        }
        if (isGoogleNetworkError(err) && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        if (isGoogleNetworkError(err)) {
          const network = new Error('GOOGLE_NETWORK_ERROR');
          network.cause = err;
          throw network;
        }
        throw err;
      }
    }
    throw lastErr;
  });
}

function sanitizeDriveName(name) {
  return name.replace(/[\\/:*?"<>|]/g, '-').trim().slice(0, 100) || 'Untitled';
}

async function persistFolderCache(userId, cacheKey, folderId) {
  const current = await googleModel.getOAuthToken(userId);
  if (!current) return;
  await googleModel.saveOAuthToken(userId, { ...current, [cacheKey]: folderId });
}

async function ensurePath(userId, segments, cacheKey, { drive: existingDrive } = {}) {
  const drive = existingDrive ?? (await getDriveClientForUser(userId)).drive;

  const stored = await googleModel.getOAuthToken(userId);
  if (cacheKey && stored?.[cacheKey]) {
    return { drive, folderId: stored[cacheKey] };
  }

  let parentId = null;
  for (const segment of segments) {
    let folderId = await findFolder(drive, segment, parentId);
    if (!folderId) {
      folderId = await createFolder(drive, segment, parentId);
    }
    parentId = folderId;
  }

  if (cacheKey) {
    await persistFolderCache(userId, cacheKey, parentId);
  }

  return { drive, folderId: parentId };
}

async function findFolder(drive, name, parentId = null) {
  const parentClause = parentId ? ` and '${parentId}' in parents` : '';
  const query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentClause}`;

  const { data } = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
    pageSize: 1,
  });

  return data.files?.[0]?.id ?? null;
}

async function createFolder(drive, name, parentId = null) {
  const { data } = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    },
    fields: 'id',
  });
  return data.id;
}

export async function getDriveClientForUser(userId) {
  const stored = await googleModel.getOAuthToken(userId);
  if (!stored?.refresh_token) {
    const err = new Error('GOOGLE_NOT_CONNECTED');
    err.status = 400;
    throw err;
  }

  if (!hasRequiredGoogleScopes(stored, GOOGLE_SCOPES)) {
    const err = new Error('GOOGLE_SCOPE_INSUFFICIENT');
    err.status = 403;
    throw err;
  }

  const client = createOAuth2Client();
  const credentials = pickOAuthCredentials(stored);
  client.setCredentials(credentials);

  client.on('tokens', async (newTokens) => {
    const current = await googleModel.getOAuthToken(userId);
    const merged = mergeStoredOAuthToken(current ?? stored, newTokens);
    await googleModel.saveOAuthToken(userId, merged);
  });

  await ensureAccessToken(client, userId, credentials);

  const latestStored = (await googleModel.getOAuthToken(userId)) ?? stored;
  const drive = google.drive({ version: 'v3', auth: client });
  return { client, drive, tokens: latestStored };
}

/** Live check — refresh token alone is not enough for "connected". */
export async function verifyGoogleConnection(userId) {
  const stored = await googleModel.getOAuthToken(userId);
  if (!stored?.refresh_token) {
    return { connected: false, verified: false, reason: 'NOT_CONNECTED' };
  }

  if (!hasRequiredGoogleScopes(stored, GOOGLE_SCOPES)) {
    return { connected: false, verified: false, reason: 'SCOPE_MISSING' };
  }

  try {
    const { drive } = await getDriveClientForUser(userId);
    await drive.about.get({ fields: 'user(emailAddress)' });
    return { connected: true, verified: true };
  } catch (err) {
    if (isInvalidGrantError(err)) {
      await googleModel.clearOAuthToken(userId);
      return { connected: false, verified: false, reason: 'TOKEN_REVOKED' };
    }
    if (err.message === 'GOOGLE_SCOPE_INSUFFICIENT') {
      return { connected: false, verified: false, reason: 'SCOPE_MISSING' };
    }
    if (err.message === 'GOOGLE_NETWORK_ERROR' || isGoogleNetworkError(err)) {
      return { connected: true, verified: false, reason: 'NETWORK' };
    }
    return { connected: true, verified: false, reason: 'API_ERROR' };
  }
}

export async function ensureLibraryFolder(userId) {
  const { folderId } = await ensurePath(userId, LIBRARY_PATH, 'library_folder_id');
  return folderId;
}

export async function uploadFileToLibrary(userId, { buffer, filename, mimeType }) {
  const { drive } = await getDriveClientForUser(userId);
  const folderId = await ensureLibraryFolder(userId);

  const { data } = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: 'id, name, mimeType, size',
  });

  return data;
}

export async function streamDriveFile(userId, fileId, rangeHeader) {
  const { drive } = await getDriveClientForUser(userId);

  const meta = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size',
  });

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    {
      responseType: 'stream',
      headers: rangeHeader ? { Range: rangeHeader } : undefined,
    },
  );

  return {
    stream: response.data,
    mimeType: meta.data.mimeType,
    size: meta.data.size,
    name: meta.data.name,
    status: rangeHeader ? 206 : 200,
  };
}

export async function revokeGoogleAccess(userId) {
  try {
    const { client } = await getDriveClientForUser(userId);
    const token = client.credentials.access_token ?? client.credentials.refresh_token;
    if (token) {
      await client.revokeToken(token);
    }
  } catch {
    // Token may already be invalid — continue clearing local record.
  }
}

export async function ensureProjectsRootFolder(userId, { drive } = {}) {
  const { folderId } = await ensurePath(userId, PROJECTS_PATH, 'projects_folder_id', { drive });
  return folderId;
}

export async function createProjectWorkspace(userId, title) {
  const { drive } = await getDriveClientForUser(userId);
  const projectsRoot = await ensureProjectsRootFolder(userId);
  const folderName = sanitizeDriveName(title);
  const folderId = await createFolder(drive, folderName, projectsRoot);

  const { data: doc } = await drive.files.create({
    requestBody: {
      name: title,
      mimeType: 'application/vnd.google-apps.document',
      parents: [folderId],
    },
    fields: 'id, name',
  });

  return {
    googleDocsFileId: doc.id,
    googleDriveFolderId: folderId,
  };
}

export function isDriveNotFoundError(err) {
  const status = err?.code ?? err?.response?.status ?? err?.status;
  const message = err?.response?.data?.error?.message ?? err?.message ?? '';
  return status === 404 || /not found|file not found/i.test(message);
}

async function driveFileExists(drive, fileId) {
  if (!fileId) return false;

  try {
    const { data } = await drive.files.get({
      fileId,
      fields: 'id, trashed',
      supportsAllDrives: true,
    });
    return Boolean(data.id && !data.trashed);
  } catch (err) {
    if (isDriveNotFoundError(err)) return false;
    throw err;
  }
}

async function createGoogleDocInFolder(drive, title, folderId) {
  const { data: doc } = await drive.files.create({
    requestBody: {
      name: title,
      mimeType: 'application/vnd.google-apps.document',
      parents: [folderId],
    },
    fields: 'id, name',
  });

  return doc.id;
}

/** Ensure project Google Doc exists; recreate doc (and folder if needed) when missing. */
export async function ensureProjectGoogleDoc(
  userId,
  { title, googleDocsFileId, googleDriveFolderId },
  { drive: existingDrive } = {},
) {
  const drive = existingDrive ?? (await getDriveClientForUser(userId)).drive;

  if (await driveFileExists(drive, googleDocsFileId)) {
    return {
      googleDocsFileId,
      googleDriveFolderId,
      recreated: false,
    };
  }

  let folderId = googleDriveFolderId;
  if (!(await driveFileExists(drive, folderId))) {
    const projectsRoot = await ensureProjectsRootFolder(userId, { drive });
    folderId = await createFolder(drive, sanitizeDriveName(title), projectsRoot);
  }

  const newDocId = await createGoogleDocInFolder(drive, title, folderId);

  return {
    googleDocsFileId: newDocId,
    googleDriveFolderId: folderId,
    recreated: true,
  };
}
