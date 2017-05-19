//
// /**
//  * ## Glad Tokenizer
//  *```
//  * var tokenizer = require('glad').token;
//  *
//  * tokenizer.generate(6); // <-- 6 character token
//  * tokenizer.generate(256); // <-- 256 character token
//  *
//  * var myTokenizer = tokenizer.create('0123456789');
//  * myTokenizer.generate(6) // 6 character token of '0123456789' characters
//  *
//  * // Using The Time Encoded Tokens
//  * var timeToken = tokenizer.timeCoded() // <- Time Encoded token
//  * var time = tokenizer.timeDecoded(timeToken) // <- Date().getTime()
//  * var dateTime = new Date(time);
//  *
//  *```
//  */
//
// var radix = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ-0987654321_abcdefghijklmnopqrstuvwxyz';
//
// var baseTime = 1456931443188;
//
//
// function rand (max) {
//   return Math.floor(Math.random()*max);
// }
//
// function generate(salt, size){
//   var key = '';
//   var sl = salt.length;
//   while ( size -- ) {
//     var rnd = rand(sl);
//     key += salt[rnd];
//   }
//   return key;
// }
//
// var randomToken = function(salt, size){
//   return isNaN(size) ? undefined : (size < 1) ? undefined : generate(salt, size);
// };
//
// randomToken.generate = createGenerator;
//
// function createGenerator (salt) {
//   var temp;
//   salt = ( (typeof salt  === 'string') && (salt.length > 0) ) ? salt : radix;
//   temp = randomToken.bind(randomToken, salt);
//   temp.salt = function(){ return salt; };
//   temp.create = createGenerator;
//   temp.generate = createGenerator;
//   return temp;
// }
//
// function toBase (number, base, chars) {
//
//   var output = "";
//
//   if (base > (chars = (chars || radix).split('')).length || base < 2) {
//     return '';
//   }
//
//   while (number) {
//     output = chars[number % base] + output;
//     number = Math.floor(number / base);
//   }
//
//   return output;
// }
//
// function toInt (encoded, base, chars) {
//   var output = 0;
//   var length = (encoded = encoded.split('')).length;
//   var pos = 0;
//
//   if (base > (chars = (chars || radix)).length || base < 2) {
//     return NaN;
//   }
//
//   while (length--) {
//     output += chars.indexOf(encoded[pos++]) * Math.pow(base, length);
//   }
//
//   return output;
// }
//
// // It will return a unique token for the same timestamp most of the time.
// // If the server is handling 1000+ requests per second, there may be some overlap.
// function timeCoded (base) {
//   base = base || radix;
//   return  toBase(new Date().getTime() - baseTime, base.length, base ) + ':' + module.exports.generate(4);
// }
//
// function timeDecoded (str, base) {
//   base = base || radix;
//   str=str.split(':')[0];
//   return new Date(toInt(str, base.length, base ) + baseTime);
// }
//
// exports.generate      = createGenerator();
// exports.create        = createGenerator;
// exports.timeCoded     = timeCoded;
// exports.timeDecoded   = timeDecoded;
// exports.radixes       = {
//   '62' : radix.replace(/-|_/g, ''),
//   '64' : radix,
//   '74' : radix + '!@#$%^&*()+=',
//   '84' : radix + '!@#$%^&*()+=<>[]{}|:;~'
// };

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
