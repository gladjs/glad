import "./environment.js";
import sanitizer from "sanitizer";
import sanitize from "./namespace/sanitize.js";
import Controller from "./classes/controller.js";
import cache from "./namespace/cache.js";
import imports from "./namespace/import.js";
import intermission from "./namespace/intermission.js";
import log from "./namespace/console.js";
import typePkg from "./namespace/type.js";
import token from "./namespace/token.js";
import number from "./namespace/number.js";
import object from "./namespace/object.js";
import Boot from "./boot/boot.js";
import stringPkg from "./namespace/string.js";
import date from "./namespace/date.js";

let string = new stringPkg();

export default global.Glad = {
  imports,
  intermission,
  string,
  type: typePkg,
  token,
  number,
  object,
  sanitizer,
  sanitize,
  log,
  cache,
  Controller,
  Date: date,
  async __boot__(cwd) {
    let boot = new Boot(cwd);
    await boot.exec();
  },
};
