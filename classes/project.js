import { existsSync } from "fs";
import { join } from "path";
import { get } from "../namespace/object.js";
import { chalk } from "../namespace/console.js";
import debugPkg from "debug";
import * as url from "url";
import dynamicImport from "../lib/dynamic-import.js";
import { createRequire } from "module";
import fs from "fs"
const require = createRequire(import.meta.url);


const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const GLAD_ENV = process.env["GLAD_ENV"];
const { ok, error } = chalk;
const { exit } = process;
const debug = debugPkg("glad");

export default class Project {
  constructor(projectPath) {
    debug("Project:constructor");
    this.cliPath = join(__dirname, "../..");
    this.projectPath = projectPath || process.cwd();
    this.packagePath = join(this.projectPath, "package.json");
    const configMjsPath = join(
      this.projectPath,
      "config.mjs"
    )
    if (fs.existsSync(configMjsPath)) {
      this.configPath = process.env.GLAD_PROJECT_CONFIG_PATH = configMjsPath;
    } else {
      this.configPath = process.env.GLAD_PROJECT_CONFIG_PATH = join(
        this.projectPath,
        "config.js"
      );
    }
    
    this.hooksPath = join(this.projectPath, "hooks.js");
    this.modelsPath = join(this.projectPath, "models");
    this.controllersPath = join(this.projectPath, "controllers");
    this.routesPath = join(this.projectPath, "routes");
    this.viewsPath = join(this.projectPath, "views");
    this.development = GLAD_ENV === "development";
    this.staging = GLAD_ENV === "staging";
    this.production = GLAD_ENV === "production";
  }

  async initialize() {
    debug("Project:initialize");
    let isProject = await this.isProject();
    if (isProject) {
      const conf = await dynamicImport(this.configPath);
      this.config = conf;
      this.orm = this.config.orm || "mongoose";
      ok(`Glad version ${this.cliVersion}`);
      ok(`${new Date()}`);
      ok(`Project root ${this.projectPath}`);
    } else {
      error(
        `You don't seem to be in a valid Glad project. Your current cwd is ${this.projectPath}`
      );
      exit(1);
    }
  }

  async isProject() {
    debug("Project:isProject");
    let hasPackageFile = existsSync(this.packagePath);

    if (hasPackageFile) {
      this.package = require(this.packagePath);
      this.cliVersion = get(this.package, "dependencies.glad");
      return !!this.cliVersion;
    } else {
      return false;
    }
  }
}
