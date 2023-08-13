export default {

  onFailure (req, res, custom) {
    res.status(403).send();
  },

  admin (req, res, accept, reject) {
    if (req.session && req.session.admin) {
      accept();
    } else {
      reject();
    }
  },

  goodToGo (req, res, accept, reject) {
    accept();
  }

};
