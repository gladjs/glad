import { equal, deepEqual } from "assert";
import {
  SECOND,
  MINUTE,
  HOUR as _HOUR,
  DAY as _DAY,
  parse,
  random,
  withDelimiter,
  toAbbr,
  toData,
  toTime,
  toCurrency,
  toPercent,
  toPhone,
  NumberFormatter,
} from "../namespace/number.js";
const HOUR = 60 * 60;
const DAY = 24 * HOUR;

describe("Number tests", function () {
  it("Time Constants:: should exist and be correct", function () {
    equal(SECOND, 1000);
    equal(MINUTE, 1000 * 60);
    equal(_HOUR, 1000 * 60 * 60);
    equal(_DAY, 1000 * 60 * 60 * 24);
  });

  it("parse:: Should strip weird stuff", function () {
    equal(parse("$34.72"), 34.72);
    equal(parse("65.323%"), 65.323);
    equal(parse("65%"), 65);
  });

  it("parse:: Should respect negative numbers", function () {
    equal(parse("-65%"), -65);
    equal(parse("-$65.34"), -65.34);
    equal(parse("-78.32-"), -78.32);
  });

  it("random:: Should generate a random number between x,y", function () {
    let rand = random(5, 10);
    equal(rand <= 10, true);
    equal(rand >= 5, true);
    rand = random(100, 1000);
    equal(rand <= 1000, true);
    equal(rand >= 100, true);
  });

  it("withDelimiter:: Should simply format a number with commas and decimals", function () {
    equal(withDelimiter(4), "4.00");
    equal(withDelimiter(45), "45.00");
    equal(withDelimiter(450), "450.00");
    equal(withDelimiter(4500), "4,500.00");
    equal(withDelimiter(45000), "45,000.00");
    equal(withDelimiter(450000), "450,000.00");
    equal(withDelimiter(4500000), "4,500,000.00");
    equal(withDelimiter(45000000), "45,000,000.00");
    equal(withDelimiter(450000000), "450,000,000.00");
    equal(withDelimiter(4500000000), "4,500,000,000.00");
    equal(withDelimiter(45000000000), "45,000,000,000.00");
    equal(withDelimiter(450000000000), "450,000,000,000.00");
    equal(withDelimiter(4500000000000), "4,500,000,000,000.00");
    equal(withDelimiter(45000000000000), "45,000,000,000,000.00");
    equal(withDelimiter(450000000000000), "450,000,000,000,000.00");
    equal(withDelimiter(99e19), "990,000,000,000,000,000,000.00");
  });

  it("toAbbr:: should abbreviate a number", function () {
    equal(toAbbr(45000), "45k");
    equal(toAbbr(450000), "450k");
    equal(toAbbr(4500000), "4.5m");
    equal(toAbbr(45000000), "45m");
    equal(toAbbr(450000000), "450m");
    equal(toAbbr(4500000000), "4.5b");
    equal(toAbbr(45000000000), "45b");
    equal(toAbbr(450000000000), "450b");
    equal(toAbbr(450), "450");
    equal(toAbbr(4500), "4.5k");
  });

  it("toData:: should format data", function () {
    equal(toData(126.02 * 1000), "126.0 kB");
    equal(toData(126.32 * 1000), "126.3 kB");
    equal(toData(126.32 * 1000 * 1000), "126.3 MB");
    equal(toData(126.32 * Math.pow(1000, 3)), "126.3 GB");
    equal(toData(126.32 * Math.pow(1000, 4)), "126.3 TB");
    equal(toData(126.32 * Math.pow(1000, 5)), "126.3 PB");
    equal(toData(126.32 * Math.pow(1000, 6)), "126.3 EB");
    equal(toData(126.32 * Math.pow(1000, 7)), "126.3 ZB");
    equal(toData(126.32 * Math.pow(1000, 8)), "126.3 YB");
  });

  it("toTime:: should format a number in time", function () {
    equal(toTime(50), "50 sec");
    equal(toTime(60), "1 min");
    equal(toTime(HOUR), "1 hr");
    equal(toTime(DAY), "1 day");
    equal(toTime(DAY * 30), "30 days");
    equal(toTime(DAY * 2 + 10), "2 days 10 sec");
    equal(toTime(DAY * 2 + HOUR * 2 + 32), "2 days 2 hr 32 sec");
  });

  it("toTime:: should format a number in time and return an array", function () {
    deepEqual(toTime(50, true), [0, 0, 0, 50]);
    deepEqual(toTime(60, true), [0, 0, 1, 0]);
    deepEqual(toTime(HOUR, true), [0, 1, 0, 0]);
    deepEqual(toTime(DAY, true), [1, 0, 0, 0]);
    deepEqual(toTime(DAY * 30, true), [30, 0, 0, 0]);
    deepEqual(toTime(DAY * 2 + 10, true), [2, 0, 0, 10]);
    deepEqual(toTime(DAY * 2 + HOUR * 2 + 32, true), [2, 2, 0, 32]);
  });

  it("toCurrency: should format a number to currency", function () {
    equal(toCurrency(240.658), "$240.66");
  });

  it("toCurrency:: should format a negative number to currency", function () {
    equal(toCurrency(-376240.658), "$-376,240.66");
  });

  it("toPercent:: should format a number to percentage", function () {
    equal(toPercent(43.47576353), "43.48%");
    equal(toPercent(43.47576353, 4), "43.4758%");
  });

  it("toPercent:: should format a number to percentage with extra parameters", function () {
    equal(toPercent(43873.47581765327, 4, "*", "'"), "43'873*4758%");
  });

  it("toPercent:: should format a negative number to percentage", function () {
    equal(toPercent(-43.47576353), "-43.48%");
    equal(toPercent(-43.47576353, 4), "-43.4758%");
  });

  it("toPhone:: should format a number as a phone number", function () {
    equal(toPhone(9255551212), "925-555-1212");
    equal(toPhone("9255551212"), "925-555-1212");
    equal(toPhone(9255551212, true), "(925) 555-1212");
    equal(toPhone(9255551212, true, 4528), "(925) 555-1212 x4528");
  });

  it("NumberFormatter:: should create new formatters with default parameters", function () {
    let toGBP = new NumberFormatter("£", false, 2, ",", ".");
    equal(toGBP(1234567.89), "£1.234.567,89");
  });
});
