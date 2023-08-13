import Project from '../classes/project.js';
import { ok, equal } from 'assert';
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import { join } from 'path';
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

chai.use(sinonChai);

describe('Project', function () {

  it('should initialize', function () {
    let myProject = new Project(join(__dirname, 'mocks'));
    ok(myProject);
  });

  it('should have the correct variables', function () {
    let myProject = new Project(join(__dirname, 'mocks'));
    let projPath = myProject.projectPath;
    equal(projPath, join(__dirname, 'mocks'));
    equal(myProject.packagePath, join(projPath, 'package.json'));
    equal(myProject.configPath, join(projPath, 'config.js'));
  });

  it('should find that the project is not a glad project', async function () {
    let myProject = new Project(join(__dirname, 'mocks'));
    equal(await myProject.isProject(), false);
  });

  it('should find that the project is a glad project', async function () {
    let myProject = new Project(join(__dirname, 'mock-app'));
    equal(await myProject.isProject(), true);
  });

  it('should initialize', async function () {
    let myProject = new Project(join(__dirname, 'mock-app'));
    await myProject.initialize();
    equal(myProject.orm, 'mongoose');
    ok(myProject.config.host);
  });

});
