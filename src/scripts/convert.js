require('dotenv').config()

const OpenAPI = require('../OpenAPI')
const Path = require('../Path')
const Writer = require('../Writer')
const Collection = require('../Collection')

const OPENAPI_FILENAME = 'openapi.json'
const OPENAPI_TYPE = 'OAS3'
const OUTPUT_FOLDER = './compiled'

const convert = async (locale = process.argv[1]) => {
  const path = new Path(OPENAPI_TYPE, locale)
  path.translate()

  const filename = `${path.folder}/${OPENAPI_FILENAME}`
  const openapi = new OpenAPI(filename, locale)
  const openAPISpec = await openapi.process()
  const collection = new Collection(openAPISpec, locale).process()
  const writer = new Writer(collection)

  writer.dump(OUTPUT_FOLDER, `collection.${locale}.json`)
}

const convertAll = async () => {
  const locales = process.env.LOCALES.split(',')
  return Promise.all(locales.map(locale => convert(locale)))
}

module.exports = {
  convert,
  convertAll
}
