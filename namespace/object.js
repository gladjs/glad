const lodash = require('lodash');

module.exports = {

  lodash,

  extend (...args) {
    return lodash.extend.apply(lodash, args);
  },

  clone (...args) {
    return lodash.cloneDeep.apply(lodash, args);
  },

  get (...args) {
    return lodash.get.apply(lodash, args);
  },

  hasPath (...args) {
    return !!lodash.get.apply(lodash, args);
  },

  set (...args) {
    return lodash.setWith.apply(lodash, args);
  },

  arrayToObject (arr) {
    let o = {};
    let i = 0;
    let len = arr.length;
    for (i; i < len; i +=1) {
      o[arr[i][0]] = arr[i][1];
    }
    return o;
  },

  // shallow Object Inversion
  invert (obj) {
    let keys = Object.keys(obj);
    let i = 0;
    let len = keys.length;
    for (i; i < len; i +=1) {
     obj[obj[keys[i]]] = keys[i];
     delete obj[keys[i]];
    }
  },

  createShallowInvertedClone (obj) {
    let keys = Object.keys(obj);
    let i = 0;
    let len = keys.length;
    let clone = {};
    for (i; i < len; i +=1) {
     clone[obj[keys[i]]] = keys[i];
    }
    return clone;
  },

  select (obj, ...arr) {
    arr = (typeof arr[0] === typeof []) ? arr[0] : arr;
    let o = {};
    let i = 0;
    let len = arr.length;
    for (i; i < len; i +=1) {
      o[arr[i]] = obj[arr[i]];
    }
    return o;
  },

  selectCombination (objects, ...arr) {
    arr = (typeof arr[0] === typeof []) ? arr[0] : arr;
    let i = 0;
    let len = arr.length;
    let o = {};

    for (i = 0; i < len; i +=1) {
      inner:
      for (let x= 0; x < objects.length; x +=1) {
        if (objects[x][arr[i]]) {
          o[arr[i]] = objects[x][arr[i]];
          break inner;
        }
      }
    }

    return o;
  },

  drop (obj, ...arr) {
    arr = (typeof arr[0] === typeof []) ? arr[0] : arr;
    let i = 0;
    let len = arr.length;
    for (i; i < len; i +=1) {
      delete obj[arr[i]];
    }
  },

  format (object, ...keys) {
    keys = (typeof keys[0] === typeof []) ? keys[0] : keys;
    let i = 0;
    let len = keys.length;
    let o = {};

    for (i; i < len; i +=1) {
      if (typeof keys[i] === 'string') {
        o[keys[i]] = object[keys[i]]
      } else if (keys[i].length === 2) {
        o[keys[i][0]] = lodash.get(object, keys[i][1]);
      }
    }
    return o;
  },

  explode (obj) {
    let keys = Object.keys(obj);
    keys.forEach(key => {
      let value = obj[key];
      delete obj[key];
      lodash.setWith(obj, key,value);
    });

  }

}
