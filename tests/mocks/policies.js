module.exports = {

  onFailure (req, res, custom) {
    return "OK";
  },

  correctPolicy (req, res, accept) {
    req.ranPolicies = req.ranPolicies || [];
    req.ranPolicies.push('correctPolicy');
    accept();
  },

  secondPolicy (req, res, accept) {
    req.ranPolicies = req.ranPolicies || [];
    req.ranPolicies.push('secondPolicy');
    accept();
  },

  rejectingPolicy (req, res, accept, reject) {
    req.ranPolicies = req.ranPolicies || [];
    req.ranPolicies.push('rejectingPolicy');
    reject();
  }
};
