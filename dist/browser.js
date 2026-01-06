/**
 * Browser Entry Point
 *
 * Optimized exports for browser environments.
 * Excludes Node.js-specific functionality like token creation.
 */
// Re-export everything from main index
export * from './index.js';
// Browser-specific note: Token creation uses Web Crypto API
// which is available in modern browsers. For older browsers,
// you may need a polyfill.
//# sourceMappingURL=browser.js.map