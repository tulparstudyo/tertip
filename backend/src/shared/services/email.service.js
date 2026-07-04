import nodemailer from 'nodemailer';
import {
  getSmtpConfig,
  getPasswordResetExpiresHours,
} from './app-settings.service.js';
import { env } from '../../config/env.js';

let transporter = null;
let transporterKey = null;

function getTransporterKey(smtp) {
  return [smtp.host, smtp.port, smtp.secure, smtp.user, smtp.pass, smtp.from].join('|');
}

function getTransporter() {
  const smtp = getSmtpConfig();
  if (!smtp.host) return null;

  const key = getTransporterKey(smtp);
  if (!transporter || transporterKey !== key) {
    transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.user
        ? { user: smtp.user, pass: smtp.pass }
        : undefined,
    });
    transporterKey = key;
  }
  return transporter;
}

export function resetEmailTransporter() {
  transporter = null;
  transporterKey = null;
}

export async function sendPasswordResetEmail({ to, resetUrl, locale = 'tr' }) {
  const smtp = getSmtpConfig();
  const expiresHours = getPasswordResetExpiresHours();
  const isTr = locale === 'tr';
  const subject = isTr ? 'Tertip — Şifre sıfırlama' : 'Tertip — Password reset';
  const text = isTr
    ? `Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:\n\n${resetUrl}\n\nBu bağlantı ${expiresHours} saat geçerlidir. Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`
    : `Click the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in ${expiresHours} hour(s). If you did not request this, you can ignore this email.`;
  const html = isTr
    ? `<p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Bu bağlantı ${expiresHours} saat geçerlidir.</p>`
    : `<p>Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in ${expiresHours} hour(s).</p>`;

  const transport = getTransporter();
  if (!transport) {
    console.log(`[password-reset] To: ${to}\nURL: ${resetUrl}`);
    return;
  }

  await transport.sendMail({
    from: smtp.from || smtp.user,
    to,
    subject,
    text,
    html,
  });
}

export async function sendEmailVerificationEmail({ to, verifyUrl, locale = 'tr' }) {
  const smtp = getSmtpConfig();
  const hours = env.emailVerificationExpiresHours;
  const isTr = locale === 'tr';
  const subject = isTr ? 'Tertip — E-posta doğrulama' : 'Tertip — Email verification';
  const text = isTr
    ? `Hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın:\n\n${verifyUrl}\n\nBu bağlantı ${hours} saat geçerlidir.`
    : `Click the link below to verify your account:\n\n${verifyUrl}\n\nThis link expires in ${hours} hour(s).`;
  const html = isTr
    ? `<p>Hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>Bu bağlantı ${hours} saat geçerlidir.</p>`
    : `<p>Click the link below to verify your account:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in ${hours} hour(s).</p>`;

  const transport = getTransporter();
  if (!transport) {
    console.log(`[email-verification] To: ${to}\nURL: ${verifyUrl}`);
    return;
  }

  await transport.sendMail({
    from: smtp.from || smtp.user,
    to,
    subject,
    text,
    html,
  });
}
