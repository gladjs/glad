const args        = require('optimist').argv;
const assert      = require('assert');
const chai        = require("chai");
const sinon       = require("sinon");
const sinonChai   = require("sinon-chai");
const expect      = chai.expect;

let { port, host, sock, backlog } = args;
