const pdf = require('pdf-parse');

async function parsePDF(buffer) {
  return await pdf(buffer);
}

module.exports = parsePDF;