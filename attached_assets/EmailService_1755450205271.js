
const { createPostmarkProvider } = require('./providers/postmark');
const { createMockProvider } = require('./providers/mock');

function getProviderName() { return process.env.EMAIL_PROVIDER || 'postmark'; }
function createProvider() { return getProviderName() === 'mock' ? createMockProvider() : createPostmarkProvider(); }
let _inst = null;
function get() { if (_inst) return _inst; _inst = createProvider(); return _inst; }
module.exports = { get };
