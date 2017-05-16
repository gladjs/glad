const Project      = require('../classes/project');
const Server      = require('../classes/server');
const assert      = require('assert');
const path        = require('path');

Promise = require('bluebird').Promise;

describe("Server", function () {

  it('should initialize', function () {
    let myProject = new Project(path.join(__dirname, 'mock-app'));
    myProject.initialize();
    let myServer = new Server(myProject);
    assert.ok('myServer');
  });

  // Listening will be done on mock app tests
});
