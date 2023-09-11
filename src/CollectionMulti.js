require('dotenv').config()

const fs = require('fs')
const Utils = require('./Utils')

const Collection = require('./Collection')

/**
 * Our own opinionated OpenAPI to Postman converter
 * RB: This is the main class for the multi collection
 * This class extends the Collection class
 * Main difference are:
 * - The collectionPreRequest() method - PreScript for the collection
 * - The authForEndPoint() method - All endpoints inherit from the collection
 * - The defaultAuth() method - Default auth for collection is now Baearer Token
 * - The getItemEvents() method - Items do not have events/scripts, these are inhereted from the collection
 */
class CollectionMulti extends Collection {
  /**
   * Accepts an OpenAPI object
   * @class CollectionMulti
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
   * Process the OpenAPI object and returns a Postman 2.1 collection
   */
  // RB: override
  process () {
    return {
      info: this.getInfo(),
      item: this.getItems(),
      event: [this.collectionPreRequest()],
      variable: this.getVariables(),
      auth: this.defaultAuth()
    }
  }

  // PRIVATE

  authForEndPoint (endpoint) {
    // RB: All endpoints inherit fomr the collection
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
          type: 'any'
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
    const script = {
      listen: 'prerequest',
      script: {
        type: 'text/javascript',
        exec: [String(fs.readFileSync('./src/events/collectionPreReqScript.js'))]
      }
    }
    script.script.id = Utils.GenID(script)
    return script
  }
}

module.exports = CollectionMulti
