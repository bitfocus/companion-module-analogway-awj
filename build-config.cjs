/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
// This extra plugin definition for webpack is necessary because formidable (dependency of superagent) is using dynamic requires

const { NormalModuleReplacementPlugin } = require('webpack')

module.exports = {
  plugins: [
    new NormalModuleReplacementPlugin(/^hexoid$/, require.resolve('hexoid/dist/index.js')),
	]
}