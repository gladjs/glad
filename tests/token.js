const assert = require('assert');
const { generate, Tokenizer, create, timeCoded, timeDecoded } = require('../namespace/token');

describe("Token Tests", function () {

  it('should create a 6 character token', function () {
    assert(generate(6).length, 6);
  });

  it('should create a 12 character token', function () {
    assert(generate(12).length, 12);
  });

  it('should create a new tokenizer from a provided radix', function () {
    let myTokenizer = create('0123456789');
    assert(/\d/.test(myTokenizer.generate(6)), false);
  });

  it('should create a TimeEncoded Token', function () {
    let timeToken = timeCoded();
    assert.ok(timeToken);
    assert.equal(timeDecoded(timeToken).constructor === Date, true);
  });

  it('should create a TimeEncoded Token and decode it to type = Date', function () {
    let timeToken = timeCoded();
    assert.ok(timeToken);
    assert.equal(timeDecoded(timeToken).constructor === Date, true);
  });

  it('The decoded time token should only be a few milliseconds apart from creating it at most', function () {
    let timeToken = timeCoded();
    let createdAt = new Date().getTime();
    let decoded = timeDecoded(timeToken).getTime();
    // The decoded token should be after or equal to the creation time.
    assert.equal(createdAt <= decoded, true);
    // The creation time should be no more than 100ms before the decoded token
    assert.equal(createdAt + 100 > decoded, true);
  });

});
