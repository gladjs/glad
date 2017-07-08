const assert = require('assert');
let number = require('../namespace/number');
const HOUR = 60 * 60;
const DAY = 24 * HOUR;

describe("Number tests", function () {

  it("Time Constants:: should exist and be correct", function () {
    assert.equal(number.SECOND, 1000);
    assert.equal(number.MINUTE, 1000 * 60);
    assert.equal(number.HOUR, 1000 * 60 * 60);
    assert.equal(number.DAY, 1000 * 60 * 60 * 24);
  });

  it("parse:: Should strip weird stuff", function () {
    assert.equal(number.parse("$34.72"), 34.72);
    assert.equal(number.parse("65.323%"), 65.323);
    assert.equal(number.parse("65%"), 65);
  })

  it("parse:: Should respect negative numbers", function () {
    assert.equal(number.parse("-65%"), -65);
    assert.equal(number.parse("-$65.34"), -65.34);
    assert.equal(number.parse("-78.32-"), -78.32);
  });

  it("random:: Should generate a random number between x,y", function () {
    let rand = number.random(5,10);
    assert.equal(rand <= 10, true);
    assert.equal(rand >= 5, true);
    rand = number.random(100, 1000);
    assert.equal(rand <= 1000, true);
    assert.equal(rand >= 100, true);
  });

  it("withDelimiter:: Should simply format a number with commas and decimals", function () {
   assert.equal(number.withDelimiter(4), '4.00');
   assert.equal(number.withDelimiter(45), '45.00');
   assert.equal(number.withDelimiter(450), '450.00');
   assert.equal(number.withDelimiter(4500), '4,500.00');
   assert.equal(number.withDelimiter(45000), '45,000.00');
   assert.equal(number.withDelimiter(450000), '450,000.00');
   assert.equal(number.withDelimiter(4500000), '4,500,000.00');
   assert.equal(number.withDelimiter(45000000), '45,000,000.00');
   assert.equal(number.withDelimiter(450000000), '450,000,000.00');
   assert.equal(number.withDelimiter(4500000000), '4,500,000,000.00');
   assert.equal(number.withDelimiter(45000000000), '45,000,000,000.00');
   assert.equal(number.withDelimiter(450000000000), '450,000,000,000.00');
   assert.equal(number.withDelimiter(4500000000000), '4,500,000,000,000.00');
   assert.equal(number.withDelimiter(45000000000000), '45,000,000,000,000.00');
   assert.equal(number.withDelimiter(450000000000000), '450,000,000,000,000.00');
   assert.equal(number.withDelimiter(99e19),            '990,000,000,000,000,000,000.00');
 });

 it("toAbbr:: should abbreviate a number", function () {
   assert.equal(number.toAbbr(45000), '45k');
   assert.equal(number.toAbbr(450000), '450k');
   assert.equal(number.toAbbr(4500000), '4.5m');
   assert.equal(number.toAbbr(45000000), '45m');
   assert.equal(number.toAbbr(450000000), '450m');
   assert.equal(number.toAbbr(4500000000), '4.5b');
   assert.equal(number.toAbbr(45000000000), '45b');
   assert.equal(number.toAbbr(450000000000), '450b');
   assert.equal(number.toAbbr(450), '450');
   assert.equal(number.toAbbr(4500), '4.5k');
 });

 it("toData:: should format data", function () {
   assert.equal(number.toData(126.02 * 1000), '126.0 kB');
   assert.equal(number.toData(126.32 * 1000), '126.3 kB');
   assert.equal(number.toData(126.32 * 1000 * 1000), '126.3 MB');
   assert.equal(number.toData(126.32 * Math.pow(1000, 3)), '126.3 GB');
   assert.equal(number.toData(126.32 * Math.pow(1000, 4)), '126.3 TB');
   assert.equal(number.toData(126.32 * Math.pow(1000, 5)), '126.3 PB');
   assert.equal(number.toData(126.32 * Math.pow(1000, 6)), '126.3 EB');
   assert.equal(number.toData(126.32 * Math.pow(1000, 7)), '126.3 ZB');
   assert.equal(number.toData(126.32 * Math.pow(1000, 8)), '126.3 YB');
 });

 it("toTime:: should format a number in time", function () {
   assert.equal(number.toTime(50), '50 sec');
   assert.equal(number.toTime(60), '1 min');
   assert.equal(number.toTime(HOUR), '1 hr');
   assert.equal(number.toTime(DAY), '1 day');
   assert.equal(number.toTime(DAY * 30), '30 days');
   assert.equal(number.toTime( (DAY * 2) + 10), '2 days 10 sec');
   assert.equal(number.toTime( (DAY * 2) + (HOUR * 2) + 32), '2 days 2 hr 32 sec');
 });

 it("toTime:: should format a number in time and return an array", function () {
   assert.deepEqual(number.toTime(50, true), [0, 0, 0, 50]);
   assert.deepEqual(number.toTime(60, true), [0, 0, 1, 0]);
   assert.deepEqual(number.toTime(HOUR, true), [0, 1, 0, 0]);
   assert.deepEqual(number.toTime(DAY, true), [1, 0, 0, 0]);
   assert.deepEqual(number.toTime(DAY * 30, true), [30, 0, 0, 0]);
   assert.deepEqual(number.toTime( (DAY * 2) + 10, true), [2, 0, 0, 10]);
   assert.deepEqual(number.toTime( (DAY * 2) + (HOUR * 2) + 32, true), [2, 2, 0, 32]);
 });

 it("toCurrency: should format a number to currency", function () {
   assert.equal(number.toCurrency(240.658), '$240.66');
 });

 it("toCurrency:: should format a negative number to currency", function () {
   assert.equal(number.toCurrency(-376240.658), '$-376,240.66');
 });

 it("toPercent:: should format a number to percentage", function () {
   assert.equal(number.toPercent(43.47576353), '43.48%');
   assert.equal(number.toPercent(43.47576353, 4), '43.4758%');
 });

 it("toPercent:: should format a number to percentage with extra parameters", function () {
   assert.equal(number.toPercent(43873.47581765327, 4, '*', '\''), '43\'873*4758%');
 });

 it("toPercent:: should format a negative number to percentage", function () {
   assert.equal(number.toPercent(-43.47576353), '-43.48%');
   assert.equal(number.toPercent(-43.47576353, 4), '-43.4758%');
 });

 it("toPhone:: should format a number as a phone number", function () {
   assert.equal(number.toPhone(9255551212), "925-555-1212");
   assert.equal(number.toPhone('9255551212'), "925-555-1212");
   assert.equal(number.toPhone(9255551212, true), "(925) 555-1212");
   assert.equal(number.toPhone(9255551212, true, 4528), "(925) 555-1212 x4528");
 });

 it("NumberFormatter:: should create new formatters with default parameters", function () {
   let toGBP = new number.NumberFormatter("£", false, 2, ',', '.');
    assert.equal(toGBP(1234567.89), '£1.234.567,89');
 });

});
