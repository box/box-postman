const util = require('util')

const OpenAPI2Postman = require('openapi-to-postmanv2')
const openAPI2Postman = util.promisify(OpenAPI2Postman.convert)

class OpenAPI {
  constructor (filename) {
    this.filename = filename
  }

  async convert () {
    const result = await openAPI2Postman(
      { type: 'file', data: this.filename },
      {}
    )

    return result.output[0].data
  }
}

module.exports = OpenAPI
