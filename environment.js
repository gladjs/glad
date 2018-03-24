if (!process.env['GLAD_ENV']) {
  process.env['GLAD_ENV'] = process.env['NODE_ENV'] || "development";
} else if (!process.env['NODE_ENV']) {
  process.env['NODE_ENV'] = process.env['GLAD_ENV'];
}

if (!process.env['GLAD_ENV']) {
  process.env['GLAD_ENV'] = "development";
  process.env['NODE_ENV'] = "development"
}
