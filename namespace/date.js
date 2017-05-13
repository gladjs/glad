module.exports = class GladDate {

  constructor (moment, utcOffset = 0) {
    this.utcOffset = utcOffset;
    this.moment = new moment().utcOffset(utcOffset);
  }

  monthsFromNow (months/*, iso*/) {
    return this.moment().add(months, 'months').toDate();
  }

  daysFromNow (days/*, iso*/) {
    return this.moment().add(days, 'days').toDate();
  }

  minutesFromNow (minutes/*, iso*/) {
    return this.moment().add(minutes, 'minutes').toDate();
  }

  secondsFromNow (seconds/*, iso*/) {
    return this.moment().add(seconds, 'seconds').toDate();
  }

  startOfSecond (timestamp/*, iso*/) {
    return this.moment(timestamp).startOf('second').toDate();
  }

  startOfMinute (timestamp/*, iso*/) {
    return this.moment(timestamp).startOf('minute').toDate();
  }

  startOfHour (timestamp/*, iso*/) {
    return this.moment(timestamp).startOf('hour').toDate();
  }

  startOfDay (timestamp/*, iso*/) {
    return this.moment(timestamp).startOf('day').toDate();
  }

  startOfWeek (timestamp/*, iso*/) {
    return this.moment(timestamp).startOf('week').toDate();
  }

  startOfMonth (timestamp/*, iso*/) {
    return this.moment(timestamp).startOf('month').toDate();
  }

  startOfQuarter (timestamp/*, iso*/) {
    return this.moment(timestamp).startOf('quarter').toDate();
  }

  startOfYear (timestamp/*, iso*/) {
    return this.moment(timestamp).startOf('year').toDate();
  }


}
