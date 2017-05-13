const SECOND  = 1000;
const MINUTE  = 60 * SECOND;
const HOUR    = 60 * MINUTE;
const DAY     = 24 * HOUR;
const lodash  = require('lodash');

// Tested up to 99e19
function NumberFormatter (unit, rear=false) {
  return function (number, precision, decimal, comma) {
    precision = isNaN(precision = Math.abs(precision)) ? 2 : precision;
    decimal = decimal === undefined ? '.' : decimal;
    comma = comma === undefined ? ',' : comma;
    var prefix = number < 0 ? '-' : '',
      integerPortion = parseInt(number = Math.abs(+number || 0).toFixed(precision)) + '',
      modulo = (modulo = integerPortion.length) > 3 ? modulo % 3 : 0;

    return (rear ? '' : (unit || '')) +
      (prefix +
        (modulo ? integerPortion.substr(0, modulo) + comma : '') +
        integerPortion.substr(modulo).replace(/(\d{3})(?=\d)/g, '$1' + comma) +
        (precision ? decimal + Math.abs(number - integerPortion).toFixed(precision).slice(2) : '')
      ) + (rear ? (unit || '') : '');
  };
}

module.exports = {
  SECOND,
  MINUTE,
  HOUR,
  DAY,
  NumberFormatter,

  parse (str) {
    return (typeof str === typeof "") ? parseFloat(str.replace(/[^0-9\.-]/g, '')) : str;
  },

  random (...args) {
    return lodash.random.apply(lodash, args);
  },

  toCurrency : new NumberFormatter('$'),

  toPercent : new NumberFormatter('%', true),

  withDelimiter :  new NumberFormatter(),

  toPhone (number = "", formatAreaCode = false, extension = false) {
    let digits = String(number).split('');
    let areaCode = digits.slice(-10, -7).join('');
    let prefix = digits.slice(-7, -4).join('');
    let line = digits.slice(-4).join('');

    if (formatAreaCode) {
      number = `(${areaCode}) ${prefix}-${line}`;
    } else {
      number = `${areaCode}-${prefix}-${line}`;
    }

    if (extension) {
      number += ` x${extension}`
    }

    return number;
  },

  toAbbr (n, decimals) {
    decimals = decimals ? decimals + 2 : 3;

    var base = Math.floor(Math.log(Math.abs(n)) / Math.log(1000)),
      suffix = 'kmb'[base - 1],
      out = suffix ? String(n / Math.pow(1000, base)).substring(0, decimals) + suffix : '' + n;

    if (decimals === 4) {

      if (out.match(/^[0-9]\.[0-9]m/)) {
        out = out.replace('m', '0m');
      } else if (out.match(/^[0-9]m/)) {
        out = out.replace('m', '.00m');
      }
    }

    if (out.match(/\.k/)) {
      out = out.replace(/\.k/, 'k');
    }

    if (out.match(/\.m/)) {
      out = out.replace(/\.m/, 'm');
    }

    return out;
  },

  toData (bytes) {
    var si = true;

    var thresh = si ? 1000 : 1024;
    if(Math.abs(bytes) < thresh) {
      return bytes + ' B';
    }
    var units = si ?
      ['kB','MB','GB','TB','PB','EB','ZB','YB'] :
      ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
      bytes /= thresh;
      ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1)+' '+units[u];
  },

  toTime (seconds, returnArray = false) {

    let minutes = (seconds / 60) | 0;
    let hours   = (minutes / 60) | 0;
    let days    = (hours / 24) | 0;

    hours -= (days * 24);
    minutes -= (hours * 60) + (days * 24 * 60);
    seconds -= (minutes * 60) + (hours * 60 * 60) + (days * 24 * 60 * 60);

    if (returnArray) {
      return [days, hours, minutes, seconds];
    } else {
      return `${days === 1 ? "1 day " : days > 1 ? (days + " days ") : ""}${hours > 0 ? (hours + " hr ") : ""}${minutes > 0 ? (minutes + " min ") : ""}${seconds > 0 ? (seconds + " sec") : ""}`.trim();
    }
  }

  
};
