const assert = require('assert');
const moment = require('moment');
const sinon  = require('sinon');
const GladDate = require('../namespace/date');


describe("UTC Date Tests", function () {
  var clock;
  var utcDate;
  var pstDate;

  before(function () {
    clock = sinon.useFakeTimers();
    utcDate = new GladDate(moment);
    pstDate = new GladDate(moment, -8);
  });

  after(function () { clock.restore(); });

  it('monthsFromNow:: 1 month from now', function () {
    let testDate = utcDate.monthsFromNow(1);
    assert.equal(testDate.toISOString(), '1970-02-01T00:00:00.000Z');
  });

  it('monthsFromNow:: 12 months from now', function () {
    let testDate = utcDate.monthsFromNow(12);
    assert.equal(testDate.toISOString(), '1971-01-01T00:00:00.000Z');
  });

  it('monthsFromNow:: 24 months from now', function () {
    let testDate = utcDate.monthsFromNow(24);
    assert.equal(testDate.toISOString(), '1972-01-01T00:00:00.000Z');
  });


  it('weeksFromNow:: 1 week from now', function () {
    let testDate = utcDate.weeksFromNow(1);
    assert.equal(testDate.toISOString(), '1970-01-08T00:00:00.000Z');
  });

  it('daysFromNow:: 1 day from now', function () {
    let testDate = utcDate.daysFromNow(1);
    assert.equal(testDate.toISOString(), '1970-01-02T00:00:00.000Z');
  });

  it('daysFromNow:: 10 days from now', function () {
    let testDate = utcDate.daysFromNow(10);
    assert.equal(testDate.toISOString(), '1970-01-11T00:00:00.000Z');
  });

  it('hoursFromNow:: 1 hour from now', function () {
    let testDate = utcDate.hoursFromNow(1);
    assert.equal(testDate.toISOString(), '1970-01-01T01:00:00.000Z');
  });

  it('minutesFromNow:: 1 minute from now', function () {
    let testDate = utcDate.minutesFromNow(1);
    assert.equal(testDate.toISOString(), '1970-01-01T00:01:00.000Z');
  });

  it('minutesFromNow:: 14 minutes from now', function () {
    let testDate = utcDate.minutesFromNow(14);
    assert.equal(testDate.toISOString(), '1970-01-01T00:14:00.000Z');
  });

  it('secondsFromNow:: 1 second from now', function () {
    let testDate = utcDate.secondsFromNow(1);
    assert.equal(testDate.toISOString(), '1970-01-01T00:00:01.000Z');
  });

  it('secondsFromNow:: 10 seconds from now', function () {
    let testDate = utcDate.secondsFromNow(10);
    assert.equal(testDate.toISOString(), '1970-01-01T00:00:10.000Z');
  });

  it('secondsFromNow:: 61 seconds from now', function () {
    let testDate = utcDate.secondsFromNow(61);
    assert.equal(testDate.toISOString(), '1970-01-01T00:01:01.000Z');
  });

  it('startOfSecond', function () {
    let testDate = utcDate.secondsFromNow(1.2);
    let startOfSecond = utcDate.startOfSecond(testDate);
    assert.equal(startOfSecond.toISOString(), '1970-01-01T00:00:01.000Z');
  });

  it('startOfMinute', function () {
    let testDate = utcDate.minutesFromNow(1.2);
    let startOfMinute = utcDate.startOfMinute(testDate);
    assert.equal(startOfMinute.toISOString(), '1970-01-01T00:01:00.000Z');
  });

  it('startOfHour', function () {
    let testDate = utcDate.hoursFromNow(1.2);
    let startOfHour = utcDate.startOfHour(testDate);
    assert.equal(startOfHour.toISOString(), '1970-01-01T01:00:00.000Z');
  });

  it('startOfDay', function () {
    let testDate = utcDate.daysFromNow(1.2);
    let startOfDay = utcDate.startOfDay(testDate);
    assert.equal(startOfDay.toISOString(), '1970-01-02T00:00:00.000Z');
  });

  it('startOfWeek', function () {
    let testDate = utcDate.daysFromNow(22);
    let startOfWeek = utcDate.startOfWeek(testDate);
    assert.equal(startOfWeek.toISOString(), '1970-01-18T00:00:00.000Z');
  });

  it('startOfMonth', function () {
    let testDate = utcDate.daysFromNow(22);
    let startOfMonth = utcDate.startOfMonth(testDate);
    assert.equal(startOfMonth.toISOString(), '1970-01-01T00:00:00.000Z');
  });

  it('startOfMonth (2)', function () {
    let testDate = utcDate.daysFromNow(42);
    let startOfMonth = utcDate.startOfMonth(testDate);
    assert.equal(startOfMonth.toISOString(), '1970-02-01T00:00:00.000Z');
  });

  it('startOfQuarter', function () {
    let testDate = utcDate.daysFromNow(2);
    let startOfQuarter = utcDate.startOfQuarter(testDate);
    assert.equal(startOfQuarter.toISOString(), '1970-01-01T00:00:00.000Z');
  });

  it('startOfQuarter (2)', function () {
    let testDate = utcDate.daysFromNow(100);
    let startOfQuarter = utcDate.startOfQuarter(testDate);
    assert.equal(startOfQuarter.toISOString(), '1970-04-01T00:00:00.000Z');
  });

  it('startOfQuarter (3)', function () {
    let testDate = utcDate.daysFromNow(270);
    let startOfQuarter = utcDate.startOfQuarter(testDate);
    assert.equal(startOfQuarter.toISOString(), '1970-07-01T00:00:00.000Z');
  });

  it('startOfQuarter (4)', function () {
    let testDate = utcDate.daysFromNow(300);
    let startOfQuarter = utcDate.startOfQuarter(testDate);
    assert.equal(startOfQuarter.toISOString(), '1970-10-01T00:00:00.000Z');
  });

  it('startOfYear', function () {
    let testDate = utcDate.daysFromNow(300);
    let startOfYear = utcDate.startOfYear(testDate);
    assert.equal(startOfYear.toISOString(), '1970-01-01T00:00:00.000Z');
  });

  it('startOfYear (2)', function () {
    let testDate = utcDate.daysFromNow(366);
    let startOfYear = utcDate.startOfYear(testDate);
    assert.equal(startOfYear.toISOString(), '1971-01-01T00:00:00.000Z');
  });

});
