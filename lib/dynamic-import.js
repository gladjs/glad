export default async function dynamicImport(path, options) {
  try {
    let theModule = await import(path, options)
    return theModule.default
  } catch (err) {
    throw(err)
  }
}