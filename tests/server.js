import Project from "../classes/project.js";
import Server from "../classes/server.js";
import { ok } from "assert";
import { join } from "path";
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

describe("Server", function () {
  it("should initialize", function () {
    let myProject = new Project(join(__dirname, "mock-app"));
    myProject.initialize();
    let myServer = new Server(myProject);
    ok(myServer);
  });

  // Listening will be done on mock app tests
});
