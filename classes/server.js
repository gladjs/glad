import console from "../namespace/console.js";
import optimist from "optimist";
import debugPkg from "debug";
import express from "express";
import http from "http";
import { Server as socketIo  } from "socket.io"

const {
  chalk: { ok },
} = console;
const debug = debugPkg("glad");
const { argv: args } = optimist;

export default class Server {
  constructor(project) {
    debug("Server:constructor");
    this.project = project;
    this.express = express;
    this.app = this.express();
    this.server = http.createServer(this.app);
    this.websockets = new socketIo(this.server);
  }

  async listen() {
    debug("Server:listen");
    let { port, host, sock, backlog } = this.project.config;

    if (args.port) port = Number(args.port);
    if (args.host) host = args.host;
    if (args.sock) sock = args.sock;
    if (args.backlog) backlog = Number(args.backlog);

    if (process.env["CONSOLE_MODE"]) {
      ok("Running in Console Mode");
    } else {
      this.server.listen(port || sock, host, backlog, () => {
        if (sock) {
          ok(`Listening on ${sock} `);
        } else {
          ok(`Listening on ${host || "0.0.0.0"}:${port}`);
        }
        
        (
          this.project.hooks &&
          this.project.hooks.onAfterListen &&
          this.project.hooks.onAfterListen()
        );
      });
    }
  }
}
