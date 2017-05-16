module.exports = {

  onFailure (req, res, custom) {
    res.status(403).send();
  },

  admin (req, res, accept, reject) {
    if (req.session && req.session.admin) {
      accept();
    } else {
      reject();
    }
  }
  
};
