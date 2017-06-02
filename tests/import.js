const assert = require('assert');
const path = require('path');
let importer = require('../namespace/import');

describe("import methods (alias for require)", function () {

  it("should import from the cwd", function () {
    let val = importer('tests/mocks/import-me');
    assert.equal(val, 'yep');
  });

  it("should import from the cwd using Reverse camelize", function () {
    let val = importer('QueryUserMocksTests');
    assert.equal(val, 'yes');
  });

  it("should import from the cwd using Reverse camelize with dashed file name", function () {
    let val = importer('Import-meMocksTests'); // as ugly as it gets
    assert.equal(val, 'yep');
  });

  it("should import from the cwd using Reverse camelize with dashed file name and dashed folder name", function () {
    let val = importer('Foo-barImport-pathMocksTests'); // as ugly as it gets
    assert.equal(val, 'foo');
  });

});
