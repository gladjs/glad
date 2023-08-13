export function onFailure(req, res, custom) {
  return "OK";
}
export function correctPolicy(req, res, accept) {
  accept();
}

export default {
  onFailure,
  correctPolicy
}