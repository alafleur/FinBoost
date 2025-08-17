
function createMockProvider() {
  async function send(templateKey, { to, subject, model = {} }) {
    const preview = { templateKey, to, subject, model };
    console.log('[email:mock] send', JSON.stringify(preview, null, 2));
    return { ErrorCode: 0, Message: 'OK (mock)' };
  }
  return { name: 'mock', send };
}
module.exports = { createMockProvider };
