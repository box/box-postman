require('dotenv').config()

const fs = require('fs')
const Utils = require('./Utils')

const Collection = require('./Collection')

/**
 * Our own opinionated OpenAPI to Postman converter
 * RB: This is the main class for the advanced collection
 * This class extends the Collection class
 * Main difference are:
 * - The collectionPreRequest() method - PreScript for the collection
 * - The authForEndPoint() method - All endpoints inherit from the collection
 * - The defaultAuth() method - Default auth for collection is now Baearer Token
 * - The getItemEvents() method - Items do not have events/scripts, these are inhereted from the collection
 */
class CollectionAdvanced extends Collection {
  /**
   * Accepts an OpenAPI object
   * @class CollectionAdvanced
   * @extends {Collection}
   * @param {Object} openapi
   * @param {String} locale
   * @param {Array} foldersToProcess
   * @param {Boolean} verbose

   */

  constructor (openapi, locale, foldersToProcess = null, verbose = false) {
    super(openapi, locale, foldersToProcess, verbose)
  }

  /**
   * Creates the info object
   */
  getInfo () {
    const locale = this.LOCALE !== 'EN' ? ` (${this.LOCALE})` : ''
    const name = `${this.openapi.info.title} Advanced ${locale}`
    const postmanID = Utils.GenID(name)
    return {
      name,
      _postman_id: postmanID,
      description: this.openapi.info.description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    }
  }

  /**
   * Process the OpenAPI object and returns a Postman 2.1 collection
   */
  // RB: override
  process () {
    const localCollection = {
      info: this.getInfo(),
      item: this.getItems(),
      event: [this.collectionPreRequest()],
      variable: this.getVariables(),
      auth: this.defaultAuth()
    }

    // RB: inject utilities
    this.injectUtilities(localCollection)

    return localCollection
  }

  // PRIVATE

  injectUtilities (localCollection) {
    // insert Utils folder at top level item
    const folderUtilities = this.createFolder('(Utilities)', null, 'Utility scripts for Postman Collection')
    localCollection.item.unshift(folderUtilities)

    // insert create environment into Utils folder
    const folderCreateEnvironments = this.createFolder('Create Environments', folderUtilities.id, 'Utility scripts for Postman Collection')
    localCollection.item.splice(1, 0, folderCreateEnvironments)

    // insert test environment into Utils folder
    const folderTestEnvironments = this.createFolder('Test Environments', folderUtilities.id, 'Utility scripts for Postman Collection')
    localCollection.item.splice(2, 0, folderTestEnvironments)

    // insert Authorixe OAuth Box App Helper into Utils folder
    const folderAuthorizeOAuthBoxAppHelper = this.createFolder('Authorize OAuth Box App Helper', folderUtilities.id, 'Utility scripts for Postman Collection')
    localCollection.item.splice(3, 0, folderAuthorizeOAuthBoxAppHelper)

    return localCollection
  }

  authForEndPoint (endpoint) {
    // RB: All endpoints inherit from the collection
    return null
  }

  defaultAuth () {
    // RB: Default auth for collection is now Baearer Token
    return this.authBearerToken()
  }

  authBearerToken () {
    return {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{access_token}}',
          type: 'string'
        }

      ]
    }
  }

  authOAuth () {
    return {
      type: 'oauth2',
      oauth2: [
        {
          key: 'accessToken',
          value: '{{access_token}}',
          type: 'string'
        },
        {
          key: 'tokenType',
          value: 'bearer',
          type: 'string'
        },
        {
          key: 'addTokenTo',
          value: 'header',
          type: 'string'
        }
      ]
    }
  }

  /**
   * Adds a pre-request script to an API call
   */
  getItemEvents (endpoint, itemId) {
    // RB: Items do not have events/scripts, these are inhereted from the collection
    return []
  }

  /**
   * Creates a pre-request event for collection
   */
  collectionPreRequest () {
    const scriptString = String(fs.readFileSync('./src/events/collectionPreReqScript.js'))
    const script = {
      listen: 'prerequest',
      script: {
        type: 'text/javascript',
        exec: [scriptString]
      }
    }
    const hash = this.calculateHash(scriptString)
    script.script.id = Utils.GenID(hash) // RB: to big for uuidv5
    return script
  }
}

module.exports = CollectionAdvanced
