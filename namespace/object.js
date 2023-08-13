import lodash from "lodash";

export const {
  extend,
  cloneDeep: clone,
  get,
  setWith,
  set
} = lodash;

export function hasPath(...args) {
  return !!get.apply(lodash, args);
}

export function arrayToObject(arr) {
  let o = {};
  let i = 0;
  let len = arr.length;
  for (i; i < len; i += 1) {
    o[arr[i][0]] = arr[i][1];
  }
  return o;
}

export function invert(obj) {
  let keys = Object.keys(obj);
  let i = 0;
  let len = keys.length;
  for (i; i < len; i += 1) {
    obj[obj[keys[i]]] = keys[i];
    delete obj[keys[i]];
  }
}

export function createShallowInvertedClone(obj) {
  let keys = Object.keys(obj);
  let i = 0;
  let len = keys.length;
  let clone = {};
  for (i; i < len; i += 1) {
    clone[obj[keys[i]]] = keys[i];
  }
  return clone;
}

export function select(obj, ...arr) {
  arr = typeof arr[0] === typeof [] ? arr[0] : arr;
  let o = {};
  let i = 0;
  let len = arr.length;
  for (i; i < len; i += 1) {
    o[arr[i]] = obj[arr[i]];
  }
  return o;
}

export function selectCombination(objects, ...arr) {
  arr = typeof arr[0] === typeof [] ? arr[0] : arr;
  let i = 0;
  let len = arr.length;
  let o = {};

  for (i = 0; i < len; i += 1) {
    inner: for (let x = 0; x < objects.length; x += 1) {
      if (objects[x][arr[i]]) {
        o[arr[i]] = objects[x][arr[i]];
        break inner;
      }
    }
  }

  return o;
}

export function drop(obj, ...arr) {
  arr = typeof arr[0] === typeof [] ? arr[0] : arr;
  let i = 0;
  let len = arr.length;
  for (i; i < len; i += 1) {
    delete obj[arr[i]];
  }
}

export function format(...args) {
  let [object, ...keys] = args;
  keys = args.length === 2 && typeof keys[0] === typeof [] ? keys[0] : keys;
  let i = 0;
  let len = keys.length;
  let o = {};

  for (i; i < len; i += 1) {
    if (typeof keys[i] === "string") {
      set(o, keys[i], get(object, keys[i]));
    } else if (keys[i].length === 2) {
      set(o, keys[i][0], get(object, keys[i][1]));
    }
  }
  return o;
}

export function explode(obj) {
  let keys = Object.keys(obj);
  keys.forEach((key) => {
    let value = obj[key];
    delete obj[key];
    setWith(obj, key, value);
  });
}

const theModule = {
  lodash,
  extend,
  clone,
  get,
  hasPath,
  set,
  arrayToObject,
  invert,
  createShallowInvertedClone,
  select,
  selectCombination,
  drop,
  format,
  explode
};

export default theModule;