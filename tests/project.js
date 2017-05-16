const Project      = require('../classes/project');
const assert      = require('assert');
const chai        = require("chai");
const sinon       = require("sinon");
const sinonChai   = require("sinon-chai");
const path        = require('path');

chai.use(sinonChai);

Promise = require('bluebird').Promise;

describe('project', function () {

  it('should initialize', function () {
    let myProject = new Project(path.join(__dirname, 'mocks'));
    assert.ok(myProject);
  });

  it('should have the correct variables', function () {
    let myProject = new Project(path.join(__dirname, 'mocks'));
    let projPath = myProject.projectPath;
    assert.equal(projPath, path.join(__dirname, 'mocks'));
    assert.equal(myProject.packagePath, path.join(projPath, 'package.json'));
    assert.equal(myProject.configPath, path.join(projPath, 'config.js'));
  });

  it('should find that the project is not a glad project', function () {
    let myProject = new Project(path.join(__dirname, 'mocks'));
    assert.equal(myProject.isProject(), false);
  });

  it('should find that the project is a glad project', function () {
    let myProject = new Project(path.join(__dirname, 'mock-app'));
    assert.equal(myProject.isProject(), true);
  });

  it('should initialize', function () {
    let myProject = new Project(path.join(__dirname, 'mock-app'));
    myProject.initialize();
    assert.equal(myProject.orm, 'mongoose');
    assert.ok(myProject.config.host);
  });

});
