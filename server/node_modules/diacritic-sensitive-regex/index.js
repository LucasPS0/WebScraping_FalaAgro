function diacriticSensitiveRegex(string = '') {
  return string.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/a/g, '[a,á,à,ä,ã]')
    .replace(/e/g, '[e,é,ë,è]')
    .replace(/i/g, '[i,í,ï,ì]')
    .replace(/o/g, '[o,ó,ö,ò]')
    .replace(/u/g, '[u,ü,ú,ù]')
    .replace(/c/g, '[c,ç]');
}

module.exports = diacriticSensitiveRegex;