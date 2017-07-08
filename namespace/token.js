/**
 * ## Glad Tokenizer
 *```
 * var tokenizer = require('glad').token;
 *
 * tokenizer.generate(6); // <-- 6 character token
 * tokenizer.generate(256); // <-- 256 character token
 *
 * var myTokenizer = tokenizer.create('0123456789');
 * myTokenizer.generate(6) // 6 character token of '0123456789' characters
 *
 * // Using The Time Encoded Tokens
 * var timeToken = tokenizer.timeCoded() // <- Time Encoded token
 * var time = tokenizer.timeDecoded(timeToken) // <- Date().getTime()
 * var dateTime = new Date(time);
 *
 *```
 */

const RADIX = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ-0987654321_abcdefghijklmnopqrstuvwxyz';
const BASE_TIME = 1456931443188;

class Tokenizer {

  constructor (salt) {
    let validSalt = (salt && (typeof salt === 'string') && salt.length > 0);
    this.radix = (validSalt && salt) || RADIX;
    this.baseTime = 1456931443188;
  }

  generate (size) {
    let key = '';
    let len = this.radix.length;
    while ( size -- ) {
      let rnd = Tokenizer.rand(len);
      key += this.radix[rnd];
    }
    return key;
  }

  static rand (max = 10) {
    return Math.floor(Math.random() * max)
  }

  static toInt (encoded, base, chars) {
    let output  = 0;
    let length  = (encoded = encoded.split('')).length;
    let pos     = 0;

    if (base > (chars = (chars || RADIX)).length || base < 2) {
      return NaN;
    }

    while (length--) {
      output += chars.indexOf(encoded[pos++]) * Math.pow(base, length);
    }

    return output;
  }

  static toBase (number, base, chars) {

    var output = "";

    if (base > (chars = (chars || RADIX).split('')).length || base < 2) {
      return '';
    }

    while (number) {
      output = chars[number % base] + output;
      number = Math.floor(number / base);
    }

    return output;
  }

}

module.exports = {

  Tokenizer,

  timeCoded (base) {
    base = base || RADIX;
    return  Tokenizer.toBase(new Date().getTime() - BASE_TIME, base.length, base ) + ':' + module.exports.generate(4);
  },

  timeDecoded (str, base) {
    base = base || RADIX;
    str = str.split(':')[0];
    return new Date(Tokenizer.toInt(str, base.length, base ) + BASE_TIME);
  },

  generate : (() => {
    let defaultTokenizer = new Tokenizer();
    return defaultTokenizer.generate.bind(defaultTokenizer);
  })(),

  radixes : {
    '62' : RADIX.replace(/-|_/g, ''),
    '64' : RADIX,
    '74' : RADIX + '!@#$%^&*()+=',
    '84' : RADIX + '!@#$%^&*()+=<>[]{}|:;~'
  },

  create (salt = RADIX) {
    let newTokenizer = new Tokenizer(salt);
    return newTokenizer;
  }

};
