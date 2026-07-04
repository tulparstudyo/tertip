import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';

let transporter = null;

function getTransporter() {
  if (!env.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user
        ? { user: env.smtp.user, pass: env.smtp.pass }
        : undefined,
    });
  }
  return transporter;
}

export async function sendPasswordResetEmail({ to, resetUrl, locale = 'tr' }) {
  const isTr = locale === 'tr';
  const subject = isTr ? 'Tertip — Şifre sıfırlama' : 'Tertip — Password reset';
  const text = isTr
    ? `Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:\n\n${resetUrl}\n\nBu bağlantı ${env.passwordResetExpiresHours} saat geçerlidir. Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`
    : `Click the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in ${env.passwordResetExpiresHours} hour(s). If you did not request this, you can ignore this email.`;
  const html = isTr
    ? `<p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Bu bağlantı ${env.passwordResetExpiresHours} saat geçerlidir.</p>`
    : `<p>Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in ${env.passwordResetExpiresHours} hour(s).</p>`;

  const transport = getTransporter();
  if (!transport) {
    console.log(`[password-reset] To: ${to}\nURL: ${resetUrl}`);
    return;
  }

  await transport.sendMail({
    from: env.smtp.from || env.smtp.user,
    to,
    subject,
    text,
    html,
  });
}

export async function sendEmailVerificationEmail({ to, verifyUrl, locale = 'tr' }) {
  const isTr = locale === 'tr';
  const hours = env.emailVerificationExpiresHours;
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
    from: env.smtp.from || env.smtp.user,
    to,
    subject,
    text,
    html,
  });
}
