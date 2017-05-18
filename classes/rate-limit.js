/*
  Rate Limiter: Parts inspired/taken from https://github.com/classdojo/rolling-rate-limiter
*/
let microtime = require('microtime-nodejs');
let { clone } = require('../namespace/object');

module.exports = class RateLimiter {

  constructor (server, req, res, options) {
    this.req = req;
    this.res = res;
    this.options = clone(options);
    this.server = server;
    this.validateAndNormalizeOptions();
  }

  validateAndNormalizeOptions () {
    this.options.per = this.options.per || 1000;
    this.options.per = this.options.per * 1000; // microtime
    this.options.requests = this.options.requests || 10;
    this.options.waitTime = this.options.waitTime || 0;
    this.options.waitTime = this.options.waitTime * 1000; // microtime
  }

  zrangeToUserSet (stringOrArray) {
    if (this.server.redis.options.return_buffers || this.server.redis.options.detect_buffers) {
      return String(stringOrArray).split(",").map(Number);
    } else {
      return stringOrArray.map(Number);
    }
  }

  limit () {
    return new Promise ((resolve, reject) => {
      this.lookup().then( (results) => {

        let [timeLeft, remaining] = results;

        this.remaining = remaining;
        this.timeLeft = timeLeft;

        if ( timeLeft || remaining < 1) {
          reject({error: 'Limit exceeded'});
          return this.onLimitation();
        }

        this.setHeaders();
        resolve();

      }).catch(err => {
        console.log(err);
        reject(err);
        this.onLimitation();
      });
    })
  }

  // minDifference => waitTime: the minimum time (in miliseconds) between any two actions
  // maxInInterval => requests
  // per => interval

  lookup () {
    return new Promise((resolve, reject) => {

      let {requests, per, waitTime} = this.options;
      let now = microtime.now();
      let key = `rate:limit:${this.req.ip}`;
      let clearBefore = now - per;
      let batch = this.server.redis.multi();


      batch.zremrangebyscore(key, 0, clearBefore);
      batch.zrange(key, 0, -1);
      batch.zadd(key, now, now);
      batch.expire(key, Math.ceil(per / 1000000));
      batch.exec((err, resultArr) => {

        if (err) return reject(err);

        let userSet = this.zrangeToUserSet(resultArr[1]);
        let tooManyInInterval = userSet.length >= requests;
        let timeSinceLastRequest = now - userSet[userSet.length - 1];
        let remaining = requests - (userSet.length + 1);
        let result;

        if (tooManyInInterval || timeSinceLastRequest < waitTime) {
          result = Math.max(tooManyInInterval ? userSet[userSet.length - requests] - now + per : 0, waitTime ? waitTime : 0);
          result = Math.floor(result / 1000);
        } else {
          result = 0;
        }

        resolve([result, remaining]);
      });
    });
  }

  setHeaders () {
    if (this.options.setHeaders || !this.options.excludeHeaders) {
      this.res.setHeader('X-Limit-Max', this.options.requests);
      this.res.setHeader('X-Limit-Remaining', this.remaining || 0);
    }
  }

  onLimitation () {
    this.res.status(429).end();
  }

}
