const util = require('util')
const fs = require('fs')

const Converter = require('openapi-to-postmanv2')
const convert = util.promisify(Converter.convert)

let filename = '../box-openapi/build/openapi.json'

const start = async () => {
  let converted = await convert({ type: 'file', data: filename }, {})
  fs.writeFileSync('collection.json', JSON.stringify(converted.output[0].data, null, 2))
}

start()