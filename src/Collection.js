const uuid = require('uuid')

/**
 * Our own opinionated OpenAPI to Postman converter
 */
class Collection {
  /**
   * Accepts an OpenAPI object
   *
   * @param {Object} openapi
   */
  constructor (openapi) {
    this.openapi = openapi
  }

  /**
   * Process the OpenAPI object and returns a Postman 2.1 collection
   */
  process () {
    return {
      info: this.getInfo(),
      item: this.getItems(),
      event: [],
      variable: [],
      auth: null
    }
  }

  // PRIVATE

  /**
   * Creates the info object
   */
  getInfo () {
    return {
      name: this.openapi.info.title,
      _postman_id: uuid.v4(),
      description: this.openapi.info.description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    }
  }

  /**
   * Builds the folder tree and then
   * populates it with every endpoint
   */
  getItems () {
    this.createFolders()
    // this.poplateFolders()
    return this.folders
  }

  /**
   * Creates a folder tree based on our reference
   * tags
   */
  createFolders () {
    this.folders = []

    // for every tag create a folder object and place it on the tree
    this.openapi.tags.forEach(tag => {
      // a folder object
      const folder = {
        name: tag.name,
        description: tag['x-box-reference-description'],
        item: []
      }

      // if this object has a parent, find it
      // and append the sub folder
      if (tag['x-box-reference-parent-category']) {
        const parent = this.findFolder(tag['x-box-reference-parent-category'])
        parent.item.push(folder)
      // alternatively just push this folder to the root
      } else {
        this.folders.push(folder)
      }
    })
  }

  /**
   * Finds a folder instance for a given reference category ID
   */
  findFolder (id) {
    // first find the folder name
    const folderName = this.openapi.tags.filter(folder =>
      folder['x-box-reference-category'] === id
    )[0].name

    // return the first folder to match this name
    return this.folders.filter(folder => folder.name === folderName)[0]
  }
}

module.exports = Collection
