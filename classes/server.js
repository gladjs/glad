let { chalk: { ok } } = require('../namespace/console');

module.exports = class Server {

  constructor (project) {
    this.express = require('express');
    this.app = this.express();
    this.server = require('http').createServer(this.app);
    this.websockets = require('socket.io')(this.server);
    this.project = project;
  }

  listen () {
    let { port, host, sock, backlog } = this.project.config;

    if (process.env['CONSOLE_MODE']) {
      ok('Running in Console Mode');
    } else {
        this.server.listen(port || sock, host, backlog, () => {
        if (sock) {
          ok(`Listening on ${sock} `);
        } else {
          ok(`Listening on ${host || '0.0.0.0'}:${port}`);
        }
        return this.project.hooks && this.project.hooks.onAfterListen && this.project.hooksonAfterListen();
      });
    }
  }

}
