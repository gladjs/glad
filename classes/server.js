let { chalk: { ok } } = require('../namespace/console');
const args = require('optimist').argv;
const debug   = require('debug')('glad');

module.exports = class Server {

  constructor (project) {
    debug('Server:constructor');
    this.express = require('express');
    this.app = this.express();
    this.server = require('http').createServer(this.app);
    this.websockets = require('socket.io')(this.server);
    this.project = project;
  }

  listen () {
    debug('Server:listen');
    let { port, host, sock, backlog } = this.project.config;

    if (args.port)    port    = Number(args.port);
    if (args.host)    host    = args.host;
    if (args.sock)    sock    = args.sock;
    if (args.backlog) backlog = Number(args.backlog);

    if (process.env['CONSOLE_MODE']) {
      ok('Running in Console Mode');
    } else {
        this.server.listen(port || sock, host, backlog, () => {
        if (sock) {
          ok(`Listening on ${sock} `);
        } else {
          ok(`Listening on ${host || '0.0.0.0'}:${port}`);
        }
        return this.project.hooks && this.project.hooks.onAfterListen && this.project.hooks.onAfterListen();
      });
    }
  }

}
