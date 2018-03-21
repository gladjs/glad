if (!process.env['GLAD_ENV']) {
  process.env['GLAD_ENV'] = process.env['NODE_ENV'];
} else if (!process.env['NODE_ENV']) {
  process.env['NODE_ENV'] = process.env['GLAD_ENV'];
}

if (!process.env['GLAD_ENV']) {
  process.env['GLAD_ENV'] = process.env['NODE_ENV'] = "development";
}