require('dotenv').config()

const OpenAPI = require('../OpenAPI')
const Path = require('../Path')
const Writer = require('../Writer')

const OPENAPI_FILENAME = 'openapi.json'
const OPENAPI_TYPE = 'OAS3'
const OUTPUT_FOLDER = './compiled'

const convert = async (locale = process.argv[1]) => {
  const path = new Path(OPENAPI_TYPE, locale)
  path.translate()

  const filename = `${path.folder}/${OPENAPI_FILENAME}`
  const openapi = new OpenAPI(filename, locale)
  const collection = await openapi.convert()
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
