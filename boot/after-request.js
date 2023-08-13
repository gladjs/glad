import console from './../namespace/console.js';
import string from './../namespace/string.js';
const { log, timeEnd } = console;
const { color } = new string();

export default class RequestEnd {

  constructor (project, onAfterResponse) {
    this.project = project
    this.onAfterResponse = onAfterResponse;
  }

  async initialize () {
    const { default: config } = await import(this.project.configPath);
    this.logging = config.logHTTP;
  }

  end (req, res, next) {
    req.on("end", () => {
      if (this.logging) {
        let code = res.statusCode;
        let _color = (code >= 400 && code < 500) ? "yellow" : (code >= 500) ? "red" : "green";
        log(
          color(`← Response  ${req.id} ${res.statusCode} ${res.statusMessage} [${(res._headers && res._headers['content-length'] || 0)} bytes]`, _color)
        );
        timeEnd(`Timing    ${req.id}`);
      }

      this.mapEndingHook(req, res);
    });
    next();
  }


  mapEndingHook (req, res) {
    // ... Implement the onAfterEnd Hooks
  }

}
