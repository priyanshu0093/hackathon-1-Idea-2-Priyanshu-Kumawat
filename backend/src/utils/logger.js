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
];

function redactSensitiveData(data) {
  if (!data || typeof data !== 'object') {
    return data;
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
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export const logger = {
  info: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const safeMeta = Object.keys(meta).length > 0 ? ` ${JSON.stringify(redactSensitiveData(meta))}` : '';
    console.log(`[${timestamp}] [INFO] ${message}${safeMeta}`);
  },
  warn: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const safeMeta = Object.keys(meta).length > 0 ? ` ${JSON.stringify(redactSensitiveData(meta))}` : '';
    console.warn(`[${timestamp}] [WARN] ${message}${safeMeta}`);
  },
  error: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const safeMeta = Object.keys(meta).length > 0 ? ` ${JSON.stringify(redactSensitiveData(meta))}` : '';
    console.error(`[${timestamp}] [ERROR] ${message}${safeMeta}`);
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      const safeMeta = Object.keys(meta).length > 0 ? ` ${JSON.stringify(redactSensitiveData(meta))}` : '';
      console.debug(`[${timestamp}] [DEBUG] ${message}${safeMeta}`);
    }
  },
};
