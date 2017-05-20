module.exports = class GladDate {

  constructor (moment, utcOffset = 0) {
    this.utcOffset = utcOffset;
    this.moment = moment;
  }

  monthsFromNow (months/*, iso*/) {
    return this.moment().utcOffset(this.utcOffset).add(months, 'months').toDate();
  }

  weeksFromNow (weeks/*, iso*/) {
    return this.moment().utcOffset(this.utcOffset).add(weeks, 'weeks').toDate();
  }

  daysFromNow (days/*, iso*/) {
    return this.moment().utcOffset(this.utcOffset).add(days, 'days').toDate();
  }

  hoursFromNow (hours/*, iso*/) {
    return this.moment().utcOffset(this.utcOffset).add(hours, 'hours').toDate();
  }

  minutesFromNow (minutes/*, iso*/) {
    return this.moment().utcOffset(this.utcOffset).add(minutes, 'minutes').toDate();
  }

  secondsFromNow (seconds/*, iso*/) {
    return this.moment().utcOffset(this.utcOffset).add(seconds, 'seconds').toDate();
  }

  startOfSecond (timestamp/*, iso*/) {
    return this.moment(timestamp).utcOffset(this.utcOffset).milliseconds(0).toDate();
  }

  startOfMinute (timestamp/*, iso*/) {
    return this.moment(timestamp).utcOffset(this.utcOffset).startOf('minute').toDate();
  }

  startOfHour (timestamp/*, iso*/) {
    return this.moment(timestamp).utcOffset(this.utcOffset).startOf('hour').toDate();
  }

  startOfDay (timestamp/*, iso*/) {
    return this.moment(timestamp).utcOffset(this.utcOffset).startOf('day').toDate();
  }

  // Sunday
  startOfWeek (timestamp/*, iso*/) {
    return this.moment(timestamp).utcOffset(this.utcOffset).startOf('week').toDate();
  }

  startOfMonth (timestamp/*, iso*/) {
    return this.moment(timestamp).utcOffset(this.utcOffset).startOf('month').toDate();
  }

  startOfQuarter (timestamp/*, iso*/) {
    return this.moment(timestamp).utcOffset(this.utcOffset).startOf('quarter').toDate();
  }

  startOfYear (timestamp/*, iso*/) {
    return this.moment(timestamp).utcOffset(this.utcOffset).startOf('year').toDate();
  }


}
