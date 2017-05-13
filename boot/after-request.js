const { log, timeEnd } = require('./../namespace/console');
const { color } = new (require('./../namespace/string'))();

module.exports = class RequestEnd {

  constructor (project, onAfterResponse) {
    this.logging = require(project.configPath).logHTTP;
    this.onAfterResponse = onAfterResponse;
  }

  end (req, res, next) {
    req.on("end", () => {
      if (this.logging) {
        let code = res.statusCode;
        let _color = (code >= 400 && code < 500) ? "yellow" : (code >= 500) ? "red" : "green";
        log(
          color(`Response  ${req.id} >> ${res.statusCode} ${res.statusMessage} [${(res._headers && res._headers['content-length'] || 0)} bytes]`, _color)
        );
        timeEnd(`Timing    ${req.id}`);
      }
      this.mapEndingHook(req, res);
    });
    next();
  }

  mapEndingHook (req, res) {

  }

}
