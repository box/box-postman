const fs = require('fs')

const Collection = require('./Collection')

// const VERB_PRIORITY = ['GET', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']

class OpenAPI {
  constructor (filename) {
    this.filename = filename
    this.openapi = null
    this.tags = {}
  }

  async convert () {
    this.readOpenAPI()
    this.createCollection()
    return this.collection
  }

  // private

  readOpenAPI () {
    const source = fs.readFileSync(this.filename).toString()
    this.openapi = JSON.parse(source)
  }

  async createCollection () {
    this.collection = new Collection(this.openapi).process()
  }
}

module.exports = OpenAPI
