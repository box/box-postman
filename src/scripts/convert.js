require('dotenv').config()

const fs = require('fs')

const OpenAPI = require('../OpenAPI')
const Path = require('../Path')
const Writer = require('../Writer')

const OPENAPI_FILENAME = 'openapi.json'
const OPENAPI_TYPE = 'OAS3'
const OUTPUT_FOLDER = './build'

const convert = async (locale = process.argv[1], _fs = fs) => {
  const path = new Path(OPENAPI_TYPE, locale)
  path.translate()

  const filename = `${path.folder}/${OPENAPI_FILENAME}`
  const openapi = new OpenAPI(filename, _fs)
  const collection = await openapi.convert()
  const writer = new Writer(collection, _fs)
  writer.dump(`${OUTPUT_FOLDER}/collection.${locale}.json`)
}

const convertAll = async (_fs = fs) => {
  const locales = process.env.LOCALES.split(',')
  return Promise.all(locales.map(locale => convert(locale, _fs)))
}

module.exports = {
  convert,
  convertAll
}
