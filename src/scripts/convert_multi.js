require('dotenv').config()

const OpenAPI = require('../OpenAPIMulti')
const Path = require('../Path')
const Writer = require('../Writer')

const OPENAPI_FILENAME = 'openapi.json'
const OPENAPI_TYPE = 'OAS3'
const OUTPUT_FOLDER = './compiled'

const convert = async (locale = process.argv[1], small = process.argv[2]) => {
  const path = new Path(OPENAPI_TYPE, locale)
  path.translate()

  const filename = `${path.folder}/${OPENAPI_FILENAME}`
  const openapi = new OpenAPI(filename, locale, small)
  const collection = await openapi.convert()
  const writer = new Writer(collection)

  writer.dump(OUTPUT_FOLDER, `collection.multi.${locale}.json`)
}

const convertAll = async () => {
  const locales = process.env.LOCALES.split(',')
  return Promise.all(locales.map(locale => convert(locale)))
}

module.exports = {
  convert,
  convertAll
}
