module.exports = class RateLimiter {

  constructor (server, req, res, options = { max : 5, per : 10 * 1000}) {
    this.req = req;
    this.res = res;
    this.options = options;
    this.server = server;
  }

  limit () {
    return new Promise ((resolve, reject) => {
      this.lookup().then(() => {
        if (!this.options.excludeHeaders) {
          this.res.setHeader('X-Limit-Max', this.options.max);
          this.res.setHeader('X-Limit-Remaining', this.remaining);
        }
        resolve();
      }).catch(err => {
        reject(err);
        this.onLimitation();
      });
    })
  }

  lookup () {
    return new Promise((resolve, reject) => {
      this.bump.then(count => {
        this.requestCount = count || 0;
        this.remaining = this.options.max - this.requestCount;
        return (this.remaining > 0) ? resolve() : reject();
      }).catch(reject);
    });
  }

  bump () {
    return this.server.redis.incr(`rate:limit:${this.req.ip}`);
  }

  setHeaders () {
    if (this.options.setHeaders) {
      this.res.setHeader('X-Limit-Max', this.options.max);
      this.res.setHeader('X-Limit-Remaining', this.remaining);
    }
    return Promise.resolve();
  }

  onLimitation () {
    this.res.status(429).end();
  }

}
