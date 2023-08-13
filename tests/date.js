import { equal } from 'assert';
import moment from 'moment';
import sinon from 'sinon';
import GladDate from '../namespace/date.js';


describe("UTC Date Tests", function () {
  this.beforeEach(function () {
    this.clock = sinon.useFakeTimers({
      now: 0,
      toFake: ['Date'],
    });
    this.utcDate = new GladDate(moment);
    this.pstDate = new GladDate(moment, -8);
  })
  

  afterEach(function () { this.clock.restore(); });

  it('monthsFromNow:: 1 month from now', function () {
    let testDate = this.utcDate.monthsFromNow(1);
    equal(testDate.toISOString(), '1970-02-01T00:00:00.000Z');
  });

  it('monthsFromNow:: 12 months from now', function () {
    let testDate = this.utcDate.monthsFromNow(12);
    equal(testDate.toISOString(), '1971-01-01T00:00:00.000Z');
  });

  it('monthsFromNow:: 24 months from now', function () {
    let testDate = this.utcDate.monthsFromNow(24);
    equal(testDate.toISOString(), '1972-01-01T00:00:00.000Z');
  });


  it('weeksFromNow:: 1 week from now', function () {
    let testDate = this.utcDate.weeksFromNow(1);
    equal(testDate.toISOString(), '1970-01-08T00:00:00.000Z');
  });

  it('daysFromNow:: 1 day from now', function () {
    let testDate = this.utcDate.daysFromNow(1);
    equal(testDate.toISOString(), '1970-01-02T00:00:00.000Z');
  });

  it('daysFromNow:: 10 days from now', function () {
    let testDate = this.utcDate.daysFromNow(10);
    equal(testDate.toISOString(), '1970-01-11T00:00:00.000Z');
  });

  it('hoursFromNow:: 1 hour from now', function () {
    let testDate = this.utcDate.hoursFromNow(1);
    equal(testDate.toISOString(), '1970-01-01T01:00:00.000Z');
  });

  it('minutesFromNow:: 1 minute from now', function () {
    let testDate = this.utcDate.minutesFromNow(1);
    equal(testDate.toISOString(), '1970-01-01T00:01:00.000Z');
  });

  it('minutesFromNow:: 14 minutes from now', function () {
    let testDate = this.utcDate.minutesFromNow(14);
    equal(testDate.toISOString(), '1970-01-01T00:14:00.000Z');
  });

  it('secondsFromNow:: 1 second from now', function () {
    let testDate = this.utcDate.secondsFromNow(1);
    equal(testDate.toISOString(), '1970-01-01T00:00:01.000Z');
  });

  it('secondsFromNow:: 10 seconds from now', function () {
    let testDate = this.utcDate.secondsFromNow(10);
    equal(testDate.toISOString(), '1970-01-01T00:00:10.000Z');
  });

  it('secondsFromNow:: 61 seconds from now', function () {
    let testDate = this.utcDate.secondsFromNow(61);
    equal(testDate.toISOString(), '1970-01-01T00:01:01.000Z');
  });

  it('startOfSecond', function () {
    let testDate = this.utcDate.secondsFromNow(1.2);
    let startOfSecond = this.utcDate.startOfSecond(testDate);
    equal(startOfSecond.toISOString(), '1970-01-01T00:00:01.000Z');
  });

  it('startOfMinute', function () {
    let testDate = this.utcDate.minutesFromNow(1.2);
    let startOfMinute = this.utcDate.startOfMinute(testDate);
    equal(startOfMinute.toISOString(), '1970-01-01T00:01:00.000Z');
  });

  it('startOfHour', function () {
    let testDate = this.utcDate.hoursFromNow(1.2);
    let startOfHour = this.utcDate.startOfHour(testDate);
    equal(startOfHour.toISOString(), '1970-01-01T01:00:00.000Z');
  });

  it('startOfDay', function () {
    let testDate = this.utcDate.daysFromNow(1.2);
    let startOfDay = this.utcDate.startOfDay(testDate);
    equal(startOfDay.toISOString(), '1970-01-02T00:00:00.000Z');
  });

  it('startOfWeek', function () {
    let testDate = this.utcDate.daysFromNow(22);
    let startOfWeek = this.utcDate.startOfWeek(testDate);
    equal(startOfWeek.toISOString(), '1970-01-18T00:00:00.000Z');
  });

  it('startOfMonth', function () {
    let testDate = this.utcDate.daysFromNow(22);
    let startOfMonth = this.utcDate.startOfMonth(testDate);
    equal(startOfMonth.toISOString(), '1970-01-01T00:00:00.000Z');
  });

  it('startOfMonth (2)', function () {
    let testDate = this.utcDate.daysFromNow(42);
    let startOfMonth = this.utcDate.startOfMonth(testDate);
    equal(startOfMonth.toISOString(), '1970-02-01T00:00:00.000Z');
  });

  it('startOfQuarter', function () {
    let testDate = this.utcDate.daysFromNow(2);
    let startOfQuarter = this.utcDate.startOfQuarter(testDate);
    equal(startOfQuarter.toISOString(), '1970-01-01T00:00:00.000Z');
  });

  it('startOfQuarter (2)', function () {
    let testDate = this.utcDate.daysFromNow(100);
    let startOfQuarter = this.utcDate.startOfQuarter(testDate);
    equal(startOfQuarter.toISOString(), '1970-04-01T00:00:00.000Z');
  });

  it('startOfQuarter (3)', function () {
    let testDate = this.utcDate.daysFromNow(270);
    let startOfQuarter = this.utcDate.startOfQuarter(testDate);
    equal(startOfQuarter.toISOString(), '1970-07-01T00:00:00.000Z');
  });

  it('startOfQuarter (4)', function () {
    let testDate = this.utcDate.daysFromNow(300);
    let startOfQuarter = this.utcDate.startOfQuarter(testDate);
    equal(startOfQuarter.toISOString(), '1970-10-01T00:00:00.000Z');
  });

  it('startOfYear', function () {
    let testDate = this.utcDate.daysFromNow(300);
    let startOfYear = this.utcDate.startOfYear(testDate);
    equal(startOfYear.toISOString(), '1970-01-01T00:00:00.000Z');
  });

  it('startOfYear (2)', function () {
    let testDate = this.utcDate.daysFromNow(366);
    let startOfYear = this.utcDate.startOfYear(testDate);
    equal(startOfYear.toISOString(), '1971-01-01T00:00:00.000Z');
  });

  it('creating a date in a different tz', function () {
    equal(this.pstDate.utcOffset, -8);
    equal(this.pstDate.moment().toLocaleString(), "Wed Dec 31 1969 16:00:00 GMT-0800")
  });

});
