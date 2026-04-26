// email tools — send via SMTP (lazy nodemailer), macOS Mail app, read inbox
import { execSync } from 'node:child_process';

export async function send_smtp({ to, subject, body, from = process.env.SMTP_FROM, host = process.env.SMTP_HOST, port = process.env.SMTP_PORT || 587, user = process.env.SMTP_USER, pass = process.env.SMTP_PASS } = {}) {
  if (!to || !subject) return { ok: false, error: 'to and subject required' };
  if (!host || !user || !pass) return { ok: false, error: 'SMTP_HOST/USER/PASS env vars required' };
  try {
    const nm = await import('nodemailer').catch(() => null);
    if (!nm) return { ok: false, error: 'nodemailer not installed: npm i nodemailer' };
    const transporter = nm.default.createTransport({ host, port: parseInt(port), secure: parseInt(port) === 465, auth: { user, pass } });
    const info = await transporter.sendMail({ from: from || user, to, subject, text: body });
    return { ok: true, messageId: info.messageId };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function send_mac_mail({ to, subject, body } = {}) {
  if (!to || !subject) return { ok: false, error: 'to and subject required' };
  const script = `tell application "Mail"
    set newMessage to make new outgoing message with properties {subject:"${subject.replace(/"/g, '\\"')}", content:"${(body || '').replace(/"/g, '\\"')}", visible:false}
    tell newMessage to make new to recipient with properties {address:"${to}"}
    send newMessage
  end tell`;
  try {
    execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
    return { ok: true, sent_to: to };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function inbox_count() {
  try {
    const out = execSync(`osascript -e 'tell application "Mail" to return count of messages of inbox'`, { encoding: 'utf8' }).trim();
    return { ok: true, count: parseInt(out) || 0 };
  } catch (e) { return { ok: false, error: e.message }; }
}
