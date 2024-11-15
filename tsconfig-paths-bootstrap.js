/* eslint-disable @typescript-eslint/no-require-imports,no-undef */
// these rules are disabled, because this is a BUILD file, and we need to require the tsconfig.json file
const tsConfig = require('./tsconfig.json')
const tsConfigPaths = require('tsconfig-paths')

const baseUrl = './dist' // Either absolute or relative path. If relative it's resolved to current working directory.
tsConfigPaths.register({
    baseUrl,
    paths: tsConfig.compilerOptions.paths,
})
