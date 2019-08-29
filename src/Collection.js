const uuid = require('uuid')
const { URL } = require('url')
const { resolve } = require('path')
const rmMD = require('remove-markdown')

const Example = require('./Example')

const VERB_PRIORITY = ['GET', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']

const STATUSES = {
  100: 'Continue',
  101: 'Switching Protocols',
  102: 'Processing',
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'Non-authoritative Information',
  204: 'No Content',
  205: 'Reset Content',
  206: 'Partial Content',
  207: 'Multi-Status',
  208: 'Already Reported',
  226: 'IM Used',
  300: 'Multiple Choices',
  301: 'Moved Permanently',
  302: 'Found',
  303: 'See Other',
  304: 'Not Modified',
  305: 'Use Proxy',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect',
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Payload Too Large',
  414: 'Request-URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Requested Range Not Satisfiable',
  417: 'Expectation Failed',
  421: 'Misdirected Request',
  422: 'Unprocessable Entity',
  423: 'Locked',
  424: 'Failed Dependency',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  444: 'Connection Closed Without Response',
  451: 'Unavailable For Legal Reasons',
  499: 'Client Closed Request',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates',
  507: 'Insufficient Storage',
  508: 'Loop Detected',
  510: 'Not Extended',
  511: 'Network Authentication Required',
  599: 'Network Connect Timeout Error'
}

/**
 * Our own opinionated OpenAPI to Postman converter
 */
class Collection {
  /**
   * Accepts an OpenAPI object
   *
   * @param {Object} openapi
   */
  constructor (openapi, locale) {
    this.openapi = openapi
    this.locale = locale
    this.LOCALE = locale.toUpperCase()
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
      name: `${this.openapi.info.title} (${this.LOCALE})`,
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
    this.sortVerbs()
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
      description: this.description(endpoint),
      request: this.request(verb, path, endpoint),
      response: this.response(endpoint)
    }

    const parent = this.findSubFolder(endpoint['x-box-reference-category'])
    parent.item.push(item)
  }

  description (endpoint) {
    const description = rmMD(endpoint.description.split('\n')[0])
    const slug = endpoint.operationId.replace(/_/g, '-')
    const category = this.category(endpoint)
    const link = `https://box.dev/${this.locale}/reference/${category}/#${slug}`
    return `${description}\n\n${link}`
  }

  category (endpoint) {
    const subcategory = Object.entries(this.openapi.tags)
      .filter(tag => tag[1]['x-box-reference-category'] === endpoint['x-box-reference-category'])[0][1]

    return subcategory['x-box-reference-parent-category']
  }

  pruneEmptyFolders () {
    this.folders = this.folders.map(folder => {
      folder.item = folder.item.filter(subfolder => subfolder.item.length > 0)
      return folder
    }).filter(folder => folder.item.length > 0)
  }

  sortVerbs () {
    this.folders.forEach(folder => (
      folder.item.forEach(subfolder => {
        subfolder.item.sort((a, b) => VERB_PRIORITY.indexOf(a.request.method) - VERB_PRIORITY.indexOf(b.request.method))
      })
    ))
  }

  request (verb, path, endpoint) {
    return {
      url: this.url(path, endpoint),
      auth: this.auth(endpoint),
      method: verb.toUpperCase(),
      description: this.description(endpoint),
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
    const result = resolve(`${server.pathname}${path}`)
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
    if (!endpoint.parameters) { return [] }

    return endpoint.parameters
      .filter(param => param.in === 'query')
      .map(param => ({
        key: param.name,
        value: this.serialize(param.example),
        disabled: !param.required,
        description: param.description
      }))
  }

  serialize (value) {
    if (typeof value === 'object' && value !== null && value !== undefined) {
      return JSON.stringify(value)
    } else if (value !== null && value !== undefined) {
      return String(value)
    } else {
      return ''
    }
  }

  variable (endpoint) {
    if (!endpoint.parameters) { return [] }

    return endpoint.parameters
      .filter(param => param.in === 'path')
      .map(param => ({
        key: param.name,
        value: this.serialize(param.example),
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
          value: this.serialize(param.example),
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
    if (this.mode(endpoint) !== 'urlencoded' || !endpoint.requestBody) { return [] }

    const schema = endpoint.requestBody.content['application/x-www-form-urlencoded'].schema

    return Object.entries(schema.properties)
      .map(([key, prop]) => ({
        key: key,
        value: this.serialize(prop.example),
        disabled: !schema.required.includes(key),
        description: prop.description
      }))
  }

  formdata (endpoint) {
    if (this.mode(endpoint) !== 'formdata' || !endpoint.requestBody) { return [] }

    const schema = endpoint.requestBody.content['multipart/form-data'].schema

    return Object.entries(schema.properties).map(([key, prop]) => {
      const type = prop.format === 'binary' ? 'file' : 'text'
      const value = type === 'file' ? null : new Example(prop, this.openapi).stringify()
      const required = schema.required && schema.required.includes(key)

      return {
        key: key,
        value: this.serialize(value),
        disabled: !required,
        type: type,
        description: prop.description
      }
    })
  }

  response (endpoint) {
    return Object.entries(endpoint.responses).map(([code, response]) => ({
      id: uuid.v4(),
      name: this.responseName(code, response),
      header: this.responseHeaders(response),
      body: this.responseBody(response),
      code: Number(code),
      status: STATUSES[code]
    }))
  }

  responseName (code, response) {
    return `[${code}] ${response.description.split('\n')[0]}`
  }

  responseHeaders (response) {
    if (!response.headers && !response.content) { return [] }
    if (!response.headers) { response.headers = {} }

    const headers = Object.entries(response.headers)
      .map(([name, header]) => ({
        key: name,
        value: this.serialize(header.example),
        description: header.description
      }))

    if (response.content) {
      headers.push({
        key: 'Content-Type',
        value: Object.keys(response.content)[0]
      })
    }

    return headers
  }

  responseBody (response) {
    if (!(response.content && response.content['application/json'])) { return }
    const schema = response.content['application/json'].schema

    return new Example(schema, this.openapi).stringify()
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
