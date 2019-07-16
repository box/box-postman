const fs = require('fs')
const util = require('util')
const jp = require('jsonpath')
const uuid = require('uuid')

const OpenAPI2Postman = require('openapi-to-postmanv2')
const openAPI2Postman = util.promisify(OpenAPI2Postman.convert)

const VERB_PRIORITY = ['GET', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']

class OpenAPI {
  constructor (filename) {
    this.filename = filename
    this.openapi = null
    this.tags = {}
  }

  async convert () {
    this.readOpenAPI()
    this.filterOpenAPI()
    await this.createCollection()
    this.groupCollectionByTags()
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
      {
        type: 'string',
        data: this.openapi
      },
      {}
    )
    this.collection = result.output[0].data
  }

  groupCollectionByTags () {
    this.populateItems(this.collection.item)
    this.convertTagsToValuesAndSort()
    this.convertTagItemsByVerb()
    this.collection.item = this.tags
  }

  populateItems (items) {
    items.forEach(entry => {
      if (entry.item) {
        this.populateItems(entry.item)
      } else {
        const tag = this.tagFor(entry)
        this.prepareCollectionTag(tag)
        this.appendEntry(tag, entry)
      }
    })
  }

  tagFor (entry) {
    const nodes = jp.query(this.openapi, `$.paths[*][?(@.summary=="${entry.name}")]`)
    const referenceCategory = nodes[0]['x-box-reference-category']
    const tags = jp.query(this.openapi, `$.tags[*]`).filter(tag => tag['x-box-reference-category'] === referenceCategory)
    return tags[0].name
  }

  prepareCollectionTag (tag) {
    if (!Object.keys(this.tags).includes(tag)) {
      this.tags[tag] = {
        id: uuid.v4(),
        name: tag,
        item: []
      }
    }
  }

  appendEntry (tag, item) {
    this.tags[tag].item.push(item)
  }

  convertTagsToValuesAndSort () {
    this.tags = Object.values(this.tags).sort((a, b) => {
      return a.name > b.name ? 1 : -1
    })
  }

  convertTagItemsByVerb () {
    this.tags.forEach(tag => (
      tag.item.sort((a, b) =>
        VERB_PRIORITY.indexOf(a.request.method) - VERB_PRIORITY.indexOf(b.request.method)
      )
    ))
  }
}

module.exports = OpenAPI
