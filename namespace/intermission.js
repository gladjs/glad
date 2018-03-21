module.exports = function intermission (time = 1) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}