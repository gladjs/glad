import { equal } from 'assert';
import imports from '../namespace/import.js';

describe("import methods", function () {
  function fullPath(path) {
    return `${process.env.INIT_CWD}/${path}`
  }
  it("should import from the cwd", function () {
    let value = imports('tests/mocks/import-me');
    equal(value, fullPath("tests/mocks/import-me.js"));
  });

  it("should import from the cwd using Reverse camelize", function () {
    let val = imports('QueryUserMocksTests');
    equal(val, fullPath("tests/mocks/user/query.js"));
  });

  it("should import from the cwd using Reverse camelize with dashed file name", function () {
    let val = imports('Import-meMocksTests'); // as ugly as it gets
    equal(val, fullPath('tests/mocks/import-me.js'));
  });

  it("should import from the cwd using Reverse camelize with dashed file name and dashed folder name", function () {
    let val = imports('Foo-barImport-pathMocksTests'); // as ugly as it gets
    equal(val, fullPath('tests/mocks/import-path/foo-bar.js'));
  });

  it("treats dashes in the filename as the same path segment", function () {
    let val = imports('Foo-BarImport-PathMocksTests');
    equal(val, fullPath('tests/mocks/import-path/foo-bar.js'));
  });
});
