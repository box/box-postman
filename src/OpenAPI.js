const fs = require('fs')
const deepmerge = require('deepmerge')
const { Resolver } = require('@stoplight/json-ref-resolver')
const { JSONPath } = require('jsonpath-plus')

const Collection = require('./Collection')

class OpenAPI {
  constructor (filename, locale) {
    this.filename = filename
    this.openapi = null
    this.locale = locale
    this.tags = {}
  }

  async convert () {
    this.readOpenAPI()
    this.openapi = await this.resolveReferences(this.openapi)
    this.openapi = this.resolveAllOf(this.openapi)
    //this.writeOpenAPI()
    this.createCollection()
    return this.collection
  }

  // private

  readOpenAPI () {
    const source = fs.readFileSync(this.filename).toString()
    this.openapi = JSON.parse(source)
  }

  writeOpenAPI() {

    fs.writeFileSync(
      `./compiled/openapi30.json`,
      JSON.stringify(this.openapi, null, 2)
    )
    
  }

  /**
   * Resolves all references in a specification
   */
  async resolveReferences (specification) {
    const references = await new Resolver().resolve(specification).then(res => res.result)
    // make the object writable again, as somehow the resolved returns a write only object
    return JSON.parse(JSON.stringify(references))
  }

  /**
   * deepmerges all allOf objects
   */
  resolveAllOf (openapi) {
    const paths = new JSONPath({
      path: '$..allOf',
      json: openapi,
      resultType: 'path'
    }).sort((first, second) => (
      second.length - first.length
    ))

    paths.forEach(path => {
      const parent = new JSONPath({
        path,
        json: openapi,
        resultType: 'parent'
      })[0]

      const allOf = parent.allOf
      delete parent.allOf

      const merged = deepmerge.all(allOf)
      Object.entries(merged).forEach(([key, value]) => (parent[key] = value))
    })

    return openapi
  }

  async createCollection () {
    this.collection = new Collection(this.openapi, this.locale).process()
  }
}

module.exports = OpenAPI
