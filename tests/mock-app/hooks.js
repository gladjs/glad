module.exports = {

  onAfterController : function (req, res) {
    console.log('Hook: onAfterController');
  },

  onAfterGET : function (req, res) {
    console.log('Hook: onAfterGET');
  },

  onAfterPOST : function (req, res) {
    console.log('Hook: onAfterPOST');
  },

  onAfterPUT : function (req) {
    console.log('Hook: onAfterPUT');
  },

  onAfterDELETE : function (req, res) {
    console.log('Hook: onAfterDELETE');
  }
};
