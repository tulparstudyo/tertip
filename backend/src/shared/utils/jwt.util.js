import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

export function signUserAccessToken({ userId, deviceId }) {
  return jwt.sign(
    { sub: userId, deviceId, type: 'user' },
    env.jwtUserSecret,
    { expiresIn: env.jwtUserAccessExpiresIn },
  );
}

export function verifyUserAccessToken(token) {
  return jwt.verify(token, env.jwtUserSecret);
}

export function signAdminAccessToken({ adminId, role }) {
  return jwt.sign(
    { sub: adminId, role, type: 'admin' },
    env.jwtAdminSecret,
    { expiresIn: env.jwtAdminAccessExpiresIn },
  );
}

export function verifyAdminAccessToken(token) {
  return jwt.verify(token, env.jwtAdminSecret);
}

export function signOAuthState({ userId, deviceId }) {
  return jwt.sign(
    { sub: userId, deviceId, type: 'google_oauth_state' },
    env.jwtUserSecret,
    { expiresIn: '10m' },
  );
}

export function verifyOAuthState(token) {
  const payload = jwt.verify(token, env.jwtUserSecret);
  if (payload.type !== 'google_oauth_state' || !payload.sub || !payload.deviceId) {
    throw new Error('INVALID_OAUTH_STATE');
  }
  return payload;
}

export function signStreamGatewayToken({ userId, deviceId, sourceId, fileId }) {
  return jwt.sign(
    { sub: userId, deviceId, sourceId, fileId, type: 'stream_gateway' },
    env.jwtUserSecret,
    { expiresIn: env.streamGatewayExpiresIn },
  );
}

export function verifyStreamGatewayToken(token) {
  const payload = jwt.verify(token, env.jwtUserSecret);
  if (payload.type !== 'stream_gateway' || !payload.sub || !payload.fileId) {
    throw new Error('INVALID_GATEWAY_TOKEN');
  }
  return payload;
}
