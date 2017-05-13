const chalk = require('chalk');
const CAPITALIZE = (/(^|\/)([a-z])/g);
const CAMELIZE_REGEXP_1 = (/(\-|\_|\.|\s)+(.)?/g);
const CAMELIZE_REGEXP_2 = (/(^|\/)([A-Z])/g);
const DECAMELIZE_REGEXP = (/([a-z\d])([A-Z])/g);
const DASHERIZE_REGEXP = (/[ _]/g);
const UNDERSCORE_REGEXP_1 = (/([a-z\d])([A-Z]+)/g);
const UNDERSCORE_REGEXP_2 = (/\-|\s+/g);
const WHITE_SPACES = /\s+/g;
const lodash = require('lodash');
const REPLACEMENTS = {
    //url-unsafe
    '&' : 'and',
    '?' : 'q',
    // currency
    '€': 'euro', '₢': 'cruzeiro', '₣': 'french franc', '£': 'pound',
    '₤': 'lira', '₥': 'mill', '₦': 'naira', '₧': 'peseta', '₨': 'rupee',
    '₩': 'won', '₪': 'new shequel', '₫': 'dong', '₭': 'kip', '₮': 'tugrik',
    '₯': 'drachma', '₰': 'penny', '₱': 'peso', '₲': 'guarani', '₳': 'austral',
    '₴': 'hryvnia', '₵': 'cedi', '¢': 'cent', '¥': 'yen', '元': 'yuan',
    '円': 'yen', '﷼': 'rial', '₠': 'ecu', '¤': 'currency', '฿': 'baht',
    "$": 'dollar', '₹': 'indian rupee',

    // symbols
    '©':'(c)', 'œ': 'oe', 'Œ': 'OE', '∑': 'sum', '®': '(r)', '†': '+',
    '“': '"', '”': '"', '‘': "'", '’': "'", '∂': 'd', 'ƒ': 'f', '™': 'tm',
    '℠': 'sm', '…': '...', '˚': 'o', 'º': 'o', 'ª': 'a', '•': '*',
    '∆': 'delta', '∞': 'infinity', '♥': 'love', '&': 'and', '|': 'or',
    '<': 'less', '>': 'greater',
    //emoji
};

const MULTI_CHAR_MAP = [
  [ /<3/g,    'love'],
  [ /&&/g,    'and'],
  [ /\|\|/g,  'or'],
  [ /w\//ig,  'with'],
  [ /:\)/, 'smile' ]
];

const GREEK_CHAR_MAP = {
  'α':'a', 'β':'b', 'γ':'g', 'δ':'d', 'ε':'e', 'ζ':'z', 'η':'h', 'θ':'8',
  'ι':'i', 'κ':'k', 'λ':'l', 'μ':'m', 'ν':'n', 'ξ':'3', 'ο':'o', 'π':'p',
  'ρ':'r', 'σ':'s', 'τ':'t', 'υ':'y', 'φ':'f', 'χ':'x', 'ψ':'ps', 'ω':'w',
  'ά':'a', 'έ':'e', 'ί':'i', 'ό':'o', 'ύ':'y', 'ή':'h', 'ώ':'w', 'ς':'s',
  'ϊ':'i', 'ΰ':'y', 'ϋ':'y', 'ΐ':'i',
  'Α':'A', 'Β':'B', 'Γ':'G', 'Δ':'D', 'Ε':'E', 'Ζ':'Z', 'Η':'H', 'Θ':'8',
  'Ι':'I', 'Κ':'K', 'Λ':'L', 'Μ':'M', 'Ν':'N', 'Ξ':'3', 'Ο':'O', 'Π':'P',
  'Ρ':'R', 'Σ':'S', 'Τ':'T', 'Υ':'Y', 'Φ':'F', 'Χ':'X', 'Ψ':'PS', 'Ω':'W',
  'Ά':'A', 'Έ':'E', 'Ί':'I', 'Ό':'O', 'Ύ':'Y', 'Ή':'H', 'Ώ':'W', 'Ϊ':'I',
  'Ϋ':'Y'
};

const RUSSIAN_CHAR_MAP = {
  'а':'a', 'б':'b', 'в':'v', 'г':'g', 'д':'d', 'е':'e', 'ё':'yo', 'ж':'zh',
  'з':'z', 'и':'i', 'й':'j', 'к':'k', 'л':'l', 'м':'m', 'н':'n', 'о':'o',
  'п':'p', 'р':'r', 'с':'s', 'т':'t', 'у':'u', 'ф':'f', 'х':'h', 'ц':'c',
  'ч':'ch', 'ш':'sh', 'щ':'sh', 'ъ':'u', 'ы':'y', 'э':'e', 'ю':'yu',
  'я':'ya',
  'А':'A', 'Б':'B', 'В':'V', 'Г':'G', 'Д':'D', 'Е':'E', 'Ё':'Yo', 'Ж':'Zh',
  'З':'Z', 'И':'I', 'Й':'J', 'К':'K', 'Л':'L', 'М':'M', 'Н':'N', 'О':'O',
  'П':'P', 'Р':'R', 'С':'S', 'Т':'T', 'У':'U', 'Ф':'F', 'Х':'H', 'Ц':'C',
  'Ч':'Ch', 'Ш':'Sh', 'Щ':'Sh', 'Ъ':'U', 'Ы':'Y', 'Ь':'Ь', 'Э':'E', 'Ю':'Yu',
  'Я':'Ya'
};

module.exports = class GladString {

  constructor () {}

  color (string, color) {
    try {
      return chalk[color](string);
    } catch (err) {
      return string;
    }
  }

  camelize (str) {
    return str.replace(CAMELIZE_REGEXP_1, function(match, separator, chr) {
      return chr ? chr.toUpperCase() : '';
    }).replace(CAMELIZE_REGEXP_2, function(match, separator, chr) {
      return match.toLowerCase();
    });
  }

  decamelize (str) {
    return str.replace(DECAMELIZE_REGEXP, '$1_$2').toLowerCase();
  }

  decamelizeToArray (str) {
    return str.replace(DECAMELIZE_REGEXP, '$1_$2').toLowerCase().split('_');
  }

  titelize (str) {
    return str.split(' ').map(x => this.capitalize(x)).join(' ');
  }

  capitalize (str) {
    return str.replace(CAPITALIZE, function(match) {
      return match.toUpperCase();
    });
  }

  dasherize (str) {
    return this.decamelize(str).replace(DASHERIZE_REGEXP, '-');
  }

  slasherize (str) {
    return this.decamelize(str).replace(DASHERIZE_REGEXP, '/');
  }

  reverseSlasherize (str) {
    return this.decamelize(str).split(DASHERIZE_REGEXP).reverse().join('/');
  }

  underscore (str) {
    return str.replace(UNDERSCORE_REGEXP_1, '$1_$2').
      replace(UNDERSCORE_REGEXP_2, '_').toLowerCase();
  }

  cleanSpaces (str) {
    return str.replace(WHITE_SPACES, ' ');
  }

  deburr (str = "", advanced = true) {
    let deburred;
    if (advanced) {
      MULTI_CHAR_MAP.forEach(set => (str = str.replace(set[0], set[1])));
      deburred = str.split('').map(char => {
        return REPLACEMENTS[char] || GREEK_CHAR_MAP[char] || RUSSIAN_CHAR_MAP[char] || char;
      }).join('');
    } else {
      deburred = str;
    }
    return lodash.deburr(deburred);
  }

  slugify (str) {
    return this.dasherize(this.deburr(str));
  }

  endsWith (str, val, pos) {
    return lodash.endsWith(str, val, pos);
  }

  escape (str) {
    return lodash.escape(str);
  }

  escapeRegExp (str) {
    return lodash.escapeRegExp(str);
  }

  pad (...args) {
    return lodash.pad.apply(lodash, args);
  }

  repeat (...args) {
    return lodash.repeat.apply(lodash, args);
  }

  startsWith (...args) {
    return lodash.startsWith.apply(lodash, args);
  }

  unescape (...args) {
    return lodash.unescape.apply(lodash, args);
  }

  words (...args) {
    return lodash.words.apply(lodash, args);
  }

}
