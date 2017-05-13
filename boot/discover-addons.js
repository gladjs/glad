const path = require('path');
const { existsSync } = require('fs');

/**
 * Returns an array of packages with the glad-addon keyword
 **/
function getAddons (project) {
  let addonBasePath = path.join(project.projectPath, "node_modules");
  let dependencies = Object.keys(project.package.dependencies || {});
  let devDependencies = Object.keys(project.package.devDependencies || {});
  let addons = dependencies.map(dep => detectAtPath(path.join(addonBasePath, dep)));
  let devAddons = devDependencies.map(dep => detectAtPath(path.join(addonBasePath, dep)));
  return addons.concat(devAddons).filter(a => !!a);
}

/**
 * Returns instance of Addon or null if a package has the glad-addon keyword
 **/
function detectAtPath(addonPath) {
  let pkgPath = path.join(addonPath, 'package.json');
  if (existsSync(pkgPath)) {
    const addonPkg = require(pkgPath);
    let keywords = addonPkg.keywords || [];
    if (keywords.indexOf('glad-addon') > -1) {
      return addonPkg;
    }
  }
  return null;
}

module.exports = function setProjectAddons (project) {
  project.addons = getAddons(project);
  return project.addons;
}
