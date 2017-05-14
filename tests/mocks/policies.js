module.exports = {

  onFailure (req, res, custom) {
    return "OK";
  },

  correctPolicy (req, res, accept) {
    accept();
  }
};
