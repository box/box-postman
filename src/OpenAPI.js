// ----------------
// OpenAPI 3.0 parser
// ----------------
// Description: takes the Box OpenAPI JSON file
// and resolves all references and allOf objects
// to create a consistent OpenAPI 3.0 specification
// -----------------

const fs = require('fs')
const deepmerge = require('deepmerge')
const { Resolver } = require('@stoplight/json-ref-resolver')
const { JSONPath } = require('jsonpath-plus')

class OpenAPI {
  constructor(files, locale) {
    this.files = files
    // this.filename = filename
    this.openapi = null
    this.locale = locale
    this.tags = {}
  }

  async process() {
    this.readOpenAPI()
    this.openapi = await this.resolveReferences(this.openapi)
    this.openapi = this.resolveAllOf(this.openapi)
    // this.writeOpenAPI()
    // this.createCollection()
    return this.openapi
  }

  // private

  readOpenAPI() {
    // for each file in this.files, read the file, parse it, adn append it to the this.openapi object
    for (const file of this.files) {
      const source = fs.readFileSync(file).toString()
      const openapi = JSON.parse(source)
      this.openapi = this.openapi ? deepmerge(this.openapi, openapi) : openapi
    }

    // const source = fs.readFileSync(this.filename).toString()
    // this.openapi = JSON.parse(source)
  }

  writeOpenAPI(path) {
    fs.writeFileSync(
      path,
      JSON.stringify(this.openapi, null, 2)
    )
  }

  /**
   * Resolves all references in a specification
   */
  async resolveReferences(specification) {
    const references = await new Resolver().resolve(specification).then(res => res.result)
    // make the object writable again, as somehow the resolved returns a write only object
    return JSON.parse(JSON.stringify(references))
  }

  /**
   * deepmerges all allOf objects
   */
  resolveAllOf(openapi) {
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
}

module.exports = OpenAPI
