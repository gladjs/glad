
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

var radix = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ-0987654321_abcdefghijklmnopqrstuvwxyz';

var baseTime = 1456931443188;


function rand (max) {
  return Math.floor(Math.random()*max);
}

function generate(salt, size){
    var key = '';
    var sl = salt.length;
    while ( size -- ) {
        var rnd = rand(sl);
        key += salt[rnd];
    }
    return key;
}

var randomToken = function(salt, size){
    return isNaN(size) ? undefined : (size < 1) ? undefined : generate(salt, size);
};

randomToken.gen = createGenerator;

function createGenerator (salt) {
    var temp;

    salt = ( (typeof salt  === 'string') && (salt.length > 0) ) ? salt : radix;
    temp = randomToken.bind(randomToken, salt);
    temp.salt = function(){ return salt; };
    temp.create = createGenerator;
    temp.gen = createGenerator;
    return temp;
}

function toBase (number, base, chars) {

    var output = "";

    if (base > (chars = (chars || radix).split('')).length || base < 2) {
        return '';
    }

    while (number) {
        output = chars[number % base] + output;
        number = Math.floor(number / base);
    }

    return output;
}

function toInt (encoded, base, chars) {
  var output = 0;
  var length = (encoded = encoded.split('')).length;
  var pos = 0;

  if (base > (chars = (chars || radix)).length || base < 2) {
    return NaN;
  }

  while (length--) {
    output += chars.indexOf(encoded[pos++]) * Math.pow(base, length);
  }

  return output;
}

// It will return a unique token for the same timestamp most of the time.
// If the server is handling 1000+ requests per second, there may be some overlap.
function timeCoded (base) {
    base = base || radix;
    return  toBase(new Date().getTime() - baseTime, base.length, base ) + ':' + module.exports.generate(4);
}

function timeDecoded (str, base) {
    base = base || radix;
    str=str.split(':')[0];
    return new Date(toInt(str, base.length, base ) + baseTime);
}

exports.generate      = createGenerator();
exports.create        = createGenerator;
exports.timeCoded     = timeCoded;
exports.timeDecoded   = timeDecoded;
exports.radixes       = {
    '62' : radix.replace(/-|_/g, ''),
    '64' : radix,
    '74' : radix + '!@#$%^&*()+=',
    '84' : radix + '!@#$%^&*()+=<>[]{}|:;~'
};
