
const fs = require('fs'); const path = require('path');
const TPL_DIR = path.join(__dirname, 'templates');
function read(name) { return fs.readFileSync(path.join(TPL_DIR, name), 'utf8'); }
function interpolate(str, model) {
  return str.replace(/{{\s*([.\w]+)\s*}}/g, (_, key) => {
    const val = key.split('.').reduce((acc, k) => (acc && acc[k] != null ? acc[k] : ''), model);
    return String(val ?? '');
  });
}
function includePartials(str, model) {
  return str.replace(/{{>\s*([.\w\-\/]+)\s*}}/g, (_, file) => {
    const partial = read(file);
    return interpolate(partial, model);
  });
}
async function renderTemplate(file, model = {}) {
  if (file === 'base.html') return read(file);
  const body = read(file);
  const withPartials = includePartials(body, model);
  return interpolate(withPartials, model);
}
module.exports = { renderTemplate };
