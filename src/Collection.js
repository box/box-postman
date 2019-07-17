const uuid = require('uuid')
const { URL } = require('url')

const Example = require('./Example')

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
      auth: this.defaultAuth()
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
    this.insertEndpoints()
    this.pruneEmptyFolders()
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

  insertEndpoints () {
    const paths = Object.keys(this.openapi.paths)
    paths.forEach(path => {
      const endpoints = this.openapi.paths[path]
      const verbs = Object.keys(endpoints)
      verbs.forEach(verb => this.insertEndpoint(verb, path, endpoints[verb]))
    })
  }

  insertEndpoint (verb, path, endpoint) {
    if (endpoint['x-box-postman-hidden']) { return }

    const item = {
      id: uuid.v4(),
      name: endpoint.summary,
      description: endpoint.description,
      request: this.request(verb, path, endpoint)
    }

    const parent = this.findSubFolder(endpoint['x-box-reference-category'])
    parent.item.push(item)
  }

  pruneEmptyFolders () {
    this.folders = this.folders.map(folder => {
      folder.item = folder.item.filter(subfolder => subfolder.item.length > 0)
      return folder
    }).filter(folder => folder.item.length > 0)
  }

  request (verb, path, endpoint) {
    return {
      url: this.url(path, endpoint),
      auth: this.auth(endpoint),
      method: verb.toUpperCase(),
      description: endpoint.description,
      header: this.header(endpoint),
      body: this.body(endpoint)
    }
  }

  url (path, endpoint) {
    const server = this.server(endpoint)

    return {
      protocol: 'https',
      host: server.host,
      path: this.path(server, path),
      query: this.query(endpoint),
      variable: this.variable(endpoint)
    }
  }

  path (server, path) {
    const result = `${server.pathname}${path}`
    return result.replace(/\{(.*?)\}/g, ':$1')
  }

  server (endpoint) {
    if (endpoint.servers && endpoint.servers[0]) {
      return new URL(endpoint.servers[0].url)
    } else {
      return new URL(this.openapi.servers[0].url)
    }
  }

  query (endpoint) {
    if (!endpoint.parameters) { return null }

    return endpoint.parameters
      .filter(param => param.in === 'query')
      .map(param => ({
        key: param.name,
        value: param.example,
        disabled: !param.required,
        description: param.description
      }))
  }

  variable (endpoint) {
    if (!endpoint.parameters) { return null }

    return endpoint.parameters
      .filter(param => param.in === 'path')
      .map(param => ({
        key: param.name,
        value: param.example,
        disabled: !param.required,
        description: param.description
      }))
  }

  header (endpoint) {
    let headers = []

    if (endpoint.parameters) {
      headers = endpoint.parameters
        .filter(param => param.in === 'header')
        .map(param => ({
          key: param.name,
          value: param.example,
          disabled: !param.required,
          description: param.description
        }))
    }

    if (endpoint.requestBody && endpoint.requestBody.content) {
      headers.push({
        key: 'Content-Type',
        value: Object.keys(endpoint.requestBody.content)[0]
      })
    }

    return headers
  }

  auth (endpoint) {
    if (endpoint.security && endpoint.security.length === 0) {
      return {
        type: 'noauth'
      }
    } else {
      return this.defaultAuth()
    }
  }

  defaultAuth () {
    return {
      type: 'oauth2',
      oauth2: [
        {
          key: 'accessToken',
          value: '{{accessToken}}',
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

  body (endpoint) {
    if (!(endpoint.requestBody && endpoint.requestBody.content)) { return null }

    return {
      mode: this.mode(endpoint),
      raw: this.raw(endpoint),
      urlencoded: this.urlencoded(endpoint),
      formdata: this.formdata(endpoint)
    }
  }

  mode (endpoint) {
    const mapping = {
      'application/x-www-form-urlencoded': 'urlencoded',
      'multipart/form-data': 'formdata',
      'application/octet-stream': 'file',
      'application/json': 'raw'
    }
    const contentType = Object.keys(endpoint.requestBody.content)[0]
    return mapping[contentType]
  }

  raw (endpoint) {
    if (this.mode(endpoint) !== 'raw') { return }

    const body = Object.entries(endpoint.requestBody.content)[0][1].schema
    return new Example(body, this.openapi).stringify()
  }

  urlencoded (endpoint) {
    if (this.mode(endpoint) !== 'urlencoded') { return null }
    if (!endpoint.requestBody) { return null }

    const itemName = endpoint.requestBody.content['application/x-www-form-urlencoded'].schema['$ref'].split('/schemas/')[1]
    const item = this.openapi.components.schemas[itemName]

    return Object.entries(item.properties)
      .map(([key, prop]) => ({
        key: key,
        value: prop.example,
        disabled: !item.required.includes(key),
        description: prop.description
      }))
  }

  formdata (endpoint) {
    if (this.mode(endpoint) !== 'formdata') { return null }
    if (!endpoint.requestBody) { return null }

    const schema = endpoint.requestBody.content['multipart/form-data'].schema

    return Object.entries(schema.properties).map(([key, prop]) => {
      const type = prop.format === 'binary' ? 'file' : 'text'
      const value = type === 'file' ? null : new Example(prop, this.openapi).stringify()
      const required = schema.required && schema.required.includes(key)

      return {
        key: key,
        value: value,
        disabled: !required,
        type: type,
        description: prop.description
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

  /**
   * Finds a folder instance for a given reference category ID
   */
  findSubFolder (id) {
    // first find the folder name
    const folderName = this.openapi.tags.filter(folder =>
      folder['x-box-reference-category'] === id
    )[0].name

    // return the first folder to match this name
    return this.folders.flatMap(parent => parent.item.filter(folder => folder.name === folderName))[0]
  }
}

module.exports = Collection
