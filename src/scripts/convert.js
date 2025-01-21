require('dotenv').config()

const OpenAPI = require('../OpenAPI')
const Path = require('../Path')
const Writer = require('../Writer')
const Collection = require('../Collection')

// const OPENAPI_FILENAME = 'openapi.json'
const OPENAPI_TYPE = 'OAS3'
const OUTPUT_FOLDER = './compiled'

const FOLDERS_TO_PROCESS = process.env.FOLDERS_TO_PROCESS
const CONVERT_LOG = process.env.CONVERT_LOG

const convert = async (locale = process.argv[1]) => {
  const path = new Path(OPENAPI_TYPE, locale)
  path.translate()

  // take the above path and scan for files
  files = fs.readdirSync(path.folder)
  // for each file, include the path and the file name, but only for .json files
  files = files.filter(file => file.endsWith('.json')).map(file => `${path.folder}${file}`)
  // const filename = `${path.folder}/${OPENAPI_FILENAME}`

  const openapi = new OpenAPI(files, locale)
  const openAPISpec = await openapi.process()
  const collection = new Collection(openAPISpec, locale, FOLDERS_TO_PROCESS, CONVERT_LOG).process()
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
