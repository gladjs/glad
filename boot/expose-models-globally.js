/**
* Exposes models to the global namespace.
* The model will get exposed with an uppercase first letter.
* Ex: `user` gets exposed as `User`
**/

export default function ExposeModelsGlobally(router) {
  let models = Object.keys(router.models);
  models.forEach(key => {
    let chars = key.split('');
    chars[0] = chars[0].toUpperCase();
    global[chars.join('')] = router.models[key];
  });
  return Promise.resolve();
}
