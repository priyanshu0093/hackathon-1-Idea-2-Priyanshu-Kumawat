/**
 * Safe logger with secret redaction and structured formatting
 */

const SENSITIVE_KEYS = [
  'client_secret',
  'clientsecret',
  'secret',
  'password',
  'authorization',
  'token',
  'api_key',
  'apikey',
  'seats_aero_api_key',
  'credential',
  'cookie',
  'private_key',
  'access_token',
  'refresh_token',
];

function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]')
    .replace(/(client_secret|api_key|apikey|password|secret)=([^&\s]+)/gi, '$1=[REDACTED]');
}

function redactSensitiveData(data) {
  if (!data || typeof data !== 'object') {
    return typeof data === 'string' ? sanitizeString(data) : data;
  }

  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = redactSensitiveData(value);
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export const logger = {
  info: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const cleanMsg = sanitizeString(message);
    const safeMeta = Object.keys(meta).length > 0 ? ` ${JSON.stringify(redactSensitiveData(meta))}` : '';
    console.log(`[${timestamp}] [INFO] ${cleanMsg}${safeMeta}`);
  },
  warn: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const cleanMsg = sanitizeString(message);
    const safeMeta = Object.keys(meta).length > 0 ? ` ${JSON.stringify(redactSensitiveData(meta))}` : '';
    console.warn(`[${timestamp}] [WARN] ${cleanMsg}${safeMeta}`);
  },
  error: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const cleanMsg = sanitizeString(message);
    const safeMeta = Object.keys(meta).length > 0 ? ` ${JSON.stringify(redactSensitiveData(meta))}` : '';
    console.error(`[${timestamp}] [ERROR] ${cleanMsg}${safeMeta}`);
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      const cleanMsg = sanitizeString(message);
      const safeMeta = Object.keys(meta).length > 0 ? ` ${JSON.stringify(redactSensitiveData(meta))}` : '';
      console.debug(`[${timestamp}] [DEBUG] ${cleanMsg}${safeMeta}`);
    }
  },
};
