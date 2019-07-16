require('dotenv').config()

const OpenAPI = require('../OpenAPI')
const Path = require('../Path')
const Writer = require('../Writer')

const OPENAPI_FILENAME = 'openapi.json'
const OPENAPI_TYPE = 'OAS3'
const OUTPUT_FOLDER = './build'

const convert = async () => {
  const locale = process.argv[1]
  const path = new Path(OPENAPI_TYPE, locale).translate()
  const filename = `${path}/${OPENAPI_FILENAME}`
  const openapi = new OpenAPI(filename)
  const collection = await openapi.convert()
  const writer = new Writer(collection)
  writer.dump(`${OUTPUT_FOLDER}/collection.${locale}.json`)
}

module.exports = convert
