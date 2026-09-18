'use strict';

const nodemailer = require('nodemailer');

let transporter = null;
let transporterSignature = null;

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean value: ${value}`);
}

function getConfig() {
  const host = String(process.env.SMTP_HOST || '').trim();

  if (!host) {
    throw new Error(
      'Email transport is not configured: SMTP_HOST is required'
    );
  }

  const port = Number(process.env.SMTP_PORT || 587);

  if (
    !Number.isInteger(port) ||
    port <= 0 ||
    port > 65535
  ) {
    throw new Error(
      'Email transport configuration invalid: SMTP_PORT must be a valid TCP port'
    );
  }

  const secure = parseBoolean(
    process.env.SMTP_SECURE,
    port === 465
  );

  const user = String(
    process.env.SMTP_USER || ''
  ).trim();

  const pass = String(
    process.env.SMTP_PASS || ''
  );

  if (
    (user && !pass) ||
    (!user && pass)
  ) {
    throw new Error(
      'Email transport configuration invalid: SMTP_USER and SMTP_PASS must be supplied together'
    );
  }

  const from =
    String(
      process.env.SMTP_FROM ||
      process.env.EMAIL_FROM ||
      user ||
      'no-reply@localhost'
    ).trim();

  return {
    host,
    port,
    secure,
    user,
    pass,
    from
  };
}

function getTransporter() {
  const config = getConfig();

  const signature = JSON.stringify({
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user
  });

  if (
    transporter &&
    transporterSignature === signature
  ) {
    return {
      transporter,
      config
    };
  }

  const options = {
    host: config.host,
    port: config.port,
    secure: config.secure
  };

  if (config.user) {
    options.auth = {
      user: config.user,
      pass: config.pass
    };
  }

  transporter = nodemailer.createTransport(options);
  transporterSignature = signature;

  return {
    transporter,
    config
  };
}

function escapeHtml(value) {
  return String(
    value === undefined || value === null
      ? ''
      : value
  )
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderPaymentTemplate(template, data = {}) {
  if (template === 'payment-success') {
    const amount =
      data.amount === undefined
        ? ''
        : String(data.amount);

    const currency =
      data.currency
        ? String(data.currency)
        : '';

    const transactionId =
      data.transactionId
        ? String(data.transactionId)
        : '';

    const date =
      data.date
        ? String(data.date)
        : '';

    const subject = 'Payment Successful';

    const text = [
      'Your payment was successful.',
      amount
        ? `Amount: ${amount}${currency ? ' ' + currency : ''}`
        : null,
      transactionId
        ? `Transaction ID: ${transactionId}`
        : null,
      date
        ? `Date: ${date}`
        : null
    ]
      .filter(Boolean)
      .join('\n');

    const html = [
      '<p>Your payment was successful.</p>',
      amount
        ? `<p><strong>Amount:</strong> ${escapeHtml(amount)}${currency ? ' ' + escapeHtml(currency) : ''}</p>`
        : '',
      transactionId
        ? `<p><strong>Transaction ID:</strong> ${escapeHtml(transactionId)}</p>`
        : '',
      date
        ? `<p><strong>Date:</strong> ${escapeHtml(date)}</p>`
        : ''
    ].join('');

    return {
      subject,
      text,
      html
    };
  }

  if (template === 'payment-failed') {
    const reason =
      data.reason
        ? String(data.reason)
        : 'Payment could not be completed';

    const transactionId =
      data.transactionId
        ? String(data.transactionId)
        : '';

    const subject = 'Payment Failed';

    const text = [
      'Your payment could not be completed.',
      `Reason: ${reason}`,
      transactionId
        ? `Transaction ID: ${transactionId}`
        : null
    ]
      .filter(Boolean)
      .join('\n');

    const html = [
      '<p>Your payment could not be completed.</p>',
      `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>`,
      transactionId
        ? `<p><strong>Transaction ID:</strong> ${escapeHtml(transactionId)}</p>`
        : ''
    ].join('');

    return {
      subject,
      text,
      html
    };
  }

  throw new Error(
    `Unsupported email template: ${template}`
  );
}

function normalizeRecipients(value) {
  const recipients = Array.isArray(value)
    ? value
    : [value];

  const normalized = recipients
    .map(item => String(item || '').trim())
    .filter(Boolean);

  if (!normalized.length) {
    throw new Error(
      'Email recipient is required'
    );
  }

  return normalized;
}

async function sendEmail(options = {}) {
  const to = normalizeRecipients(options.to);

  let subject =
    options.subject
      ? String(options.subject)
      : '';

  let text =
    options.text === undefined ||
    options.text === null
      ? ''
      : String(options.text);

  let html =
    options.html === undefined ||
    options.html === null
      ? ''
      : String(options.html);

  if (options.template) {
    const rendered = renderPaymentTemplate(
      options.template,
      options.data || {}
    );

    subject = subject || rendered.subject;
    text = text || rendered.text;
    html = html || rendered.html;
  }

  if (!subject.trim()) {
    throw new Error(
      'Email subject is required'
    );
  }

  if (!text && !html) {
    throw new Error(
      'Email body is required'
    );
  }

  const {
    transporter: activeTransporter,
    config
  } = getTransporter();

  const result =
    await activeTransporter.sendMail({
      from: options.from || config.from,
      to,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      subject,
      text: text || undefined,
      html: html || undefined,
      headers: options.headers,
      attachments: options.attachments
    });

  return {
    messageId: result.messageId || null,
    accepted: Array.isArray(result.accepted)
      ? result.accepted
      : [],
    rejected: Array.isArray(result.rejected)
      ? result.rejected
      : [],
    pending: Array.isArray(result.pending)
      ? result.pending
      : [],
    response: result.response || null
  };
}

async function send(options = {}) {
  return sendEmail(options);
}

async function sendTemplate(
  to,
  template,
  data = {},
  options = {}
) {
  return sendEmail({
    ...options,
    to,
    template,
    data
  });
}

async function sendBulk(messages = []) {
  if (!Array.isArray(messages)) {
    throw new Error(
      'sendBulk expects an array of email messages'
    );
  }

  const results = [];

  for (const message of messages) {
    results.push(
      await sendEmail(message)
    );
  }

  return results;
}

function isConfigured() {
  try {
    getConfig();
    return true;
  } catch (_) {
    return false;
  }
}

async function verifyTransport() {
  const {
    transporter: activeTransporter
  } = getTransporter();

  return activeTransporter.verify();
}

module.exports = {
  send,
  sendEmail,
  sendTemplate,
  sendBulk,
  isConfigured,
  verifyTransport
};
