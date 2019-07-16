const fs = require('fs')
const util = require('util')
const jp = require('jsonpath')

const OpenAPI2Postman = require('openapi-to-postmanv2')
const openAPI2Postman = util.promisify(OpenAPI2Postman.convert)

class OpenAPI {
  constructor (filename) {
    this.filename = filename
    this.openapi = null
  }

  async convert () {
    this.readOpenAPI()
    this.filterOpenAPI()
    await this.createCollection()
    return this.collection
  }

  // private

  readOpenAPI () {
    const source = fs.readFileSync(this.filename).toString()
    this.openapi = JSON.parse(source)
  }

  filterOpenAPI () {
    this.filterPaths()
  }

  /**
   * Filter out paths marked with x-box-postman-hidden
   */
  filterPaths () {
    jp.apply(this.openapi, '$.paths[*]', path => {
      Object.keys(path).forEach(key => {
        if (path[key]['x-box-postman-hidden']) {
          delete path[key]
        }
      })
      return path
    })
  }

  async createCollection () {
    const result = await openAPI2Postman(
      { type: 'string', data: this.openapi },
      {}
    )
    this.collection = result.output[0].data
  }
}

module.exports = OpenAPI
