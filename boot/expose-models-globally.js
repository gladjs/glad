/**
* Exposes models to the global namespace.
* The model will get exposed with an uppercase first letter.
* Ex: `user` gets exposed as `User`
**/

module.exports = function (router) {
  return new Promise (function (resolve, reject) {
    let models = Object.keys(router.models);
    models.forEach(key => {
      let chars = key.split('');
      chars[0] = chars[0].toUpperCase();
      global[chars.join('')] = router.models[key];
    });
    resolve();
  });
}
