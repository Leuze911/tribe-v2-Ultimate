// Polyfill for import.meta.env
// This must be loaded before any code that uses import.meta

if (typeof globalThis !== 'undefined') {
  // Create a fake import.meta object
  if (!globalThis.__importMeta) {
    globalThis.__importMeta = {
      env: {
        MODE: process.env.NODE_ENV || 'development',
        DEV: process.env.NODE_ENV !== 'production',
        PROD: process.env.NODE_ENV === 'production',
      },
      url: '',
    };
  }
}

// For browser environments - this won't help with the syntax error
// but documents what we need to polyfill
console.log('📦 import-meta polyfill loaded');
