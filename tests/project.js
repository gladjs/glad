import Project from "../classes/project.js";
import { ok, equal } from "assert";
import chai, {expect} from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import { join } from "path";
import * as url from "url";
import Initializer from "../boot/initialize.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

chai.use(sinonChai);

describe("Project", function () {
  it("should initialize", function () {
    let myProject = new Project(join(__dirname, "mocks"));
    ok(myProject);
  });

  it("should have the correct variables", function () {
    let myProject = new Project(join(__dirname, "mocks"));
    let projPath = myProject.projectPath;
    equal(projPath, join(__dirname, "mocks"));
    equal(myProject.packagePath, join(projPath, "package.json"));
    equal(myProject.configPath, join(projPath, "config.js"));
  });

  it("should find that the project is not a glad project", async function () {
    let myProject = new Project(join(__dirname, "mocks"));
    equal(await myProject.isProject(), false);
  });

  it("should find that the project is a glad project", async function () {
    let myProject = new Project(join(__dirname, "mock-app"));
    equal(await myProject.isProject(), true);
  });

  it("should initialize", async function () {
    let myProject = new Project(join(__dirname, "mock-app"));
    await myProject.initialize();
    equal(myProject.orm, "mongoose");
    ok(myProject.config.host);
  });

  it("should not timeout when the initializer does resolve within the timeout window", async function () {
    let myProject = new Project(join(__dirname, "mock-app"));
    myProject.config = { initializerTimeOut: 500 };
    let initializer = new Initializer(myProject, {
      app: {},
      server: {},
      express: {},
    });
    try {
      await initializer.initialize()
      ok(true)
    } catch (err) {
      equal(err.message, undefined)
    }
  });
});
