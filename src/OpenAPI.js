const Collection = require('./Collection')
const fs = require('fs')

// const VERB_PRIORITY = ['GET', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']

class OpenAPI {
  constructor (filename, _fs = fs) {
    this.filename = filename
    this.openapi = null
    this.tags = {}
    this.fs = _fs
  }

  async convert () {
    this.readOpenAPI()
    this.createCollection()
    return this.collection
  }

  // private

  readOpenAPI () {
    const source = this.fs.readFileSync(this.filename).toString()
    this.openapi = JSON.parse(source)
  }

  async createCollection () {
    this.collection = new Collection(this.openapi).process()
  }
}

module.exports = OpenAPI
