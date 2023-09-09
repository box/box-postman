const uuid = require('uuid')
const { URL } = require('url')
const { resolve } = require('path')
const rmMD = require('remove-markdown')
const fs = require('fs')
const { uniq } = require('lodash')

const Example = require('./Example')

const VERB_PRIORITY = ['GET', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']
const NAMESPACE = '33c4e6fc-44cb-4190-b19f-4a02821bc8c3'
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

// Sort 2 objects by name
const byName = (a, b) => {
  if (a.name < b.name) {
    return -1
  } else if (a.name > b.name) {
    return 1
  }
  return 0
}

// Sort two object by priority
const byPriority = (a, b) => {
  if (a['x-box-priority']) {
    return -1
  } else if (b['x-box-priority']) {
    return 1
  }
  return 0
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
  constructor (openapi, locale, small = false) {
    this.openapi = openapi
    this.locale = locale
    this.LOCALE = locale.toUpperCase()
    this.small = small //RB: if true returns a subset of the collection with only a few folders
  }

  /**
   * Process the OpenAPI object and returns a Postman 2.1 collection
   */
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

  /**
   * Creates the info object
   */
  getInfo () {
    const locale = this.LOCALE !== 'EN' ? ` (${this.LOCALE} stuff)` : ''
    return {
      name: `${this.openapi.info.title}${locale}`,
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
    if ( this.small ) {
      this.createFoldersSmall()
    } else {
      this.createFolders()
    }
    // this.insertEndpoints()
    // this.pruneEmptyFolders()
    // this.sortVerbs()
    return this.folders
  }

  /**
   * Extracts all server URLs as variables
   */
  getVariables () {
    return uniq(Object.values(this.openapi.paths).flatMap(endpoints => (
      Object.values(endpoints).map(endpoint => this.server(endpoint).host)
    ))).map(host => ({
      id: uuid.v4(),
      key: host, // .replace(/\./g, '_'),
      value: host,
      type: 'string'
    }))
  }

  /**
   * Creates a folder tree based on our reference
   * tags
   */
  createFolders () {
    this.folders = []

    // for every nested tag create a folder object and place it on the root folder
    this.openapi.tags.sort(byName).sort(byPriority).forEach(tag => {
      // only append subfolders in openapi
      const folder = {
        id: uuid.v5(tag.name,NAMESPACE), //RB: use uuid v5 to generate a deterministic uuid
        name: tag.name,
        item: []
      }

      this.folders.push(folder)
    })
  }

  // create a subset of the folders
  createFoldersSmall () {
    const foldersSubSet = ['Authorization' ,'Users', 'Files', 'Folders']

    this.folders = []

    for (const folderName of foldersSubSet) {
      const folder = {
        id: uuid.v5(folderName,NAMESPACE), //RB: use uuid v5 to generate a deterministic uuid
        name: folderName,
        item: []
      }
      this.folders.push(folder)
    }
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
      // id: uuid.v4(),
      id: uuid.v5(endpoint.operationId,NAMESPACE), //RB: use uuid v5 to generate a deterministic uuid
      // id: verb+'_'+path+'_'+endpoint.operationId,
      name: endpoint.summary,
      description: this.description(endpoint),
      request: this.request(verb, path, endpoint),
      response: this.response(endpoint),
      event: this.getItemEvents(endpoint)
    }

    // RB: only add the endpoint if the parent folder is in the subset
    try {
      const parent = this.findFolder(endpoint)
      parent.push(item)
      console.log(`${item.name} [${item.id}] added to collection`)
    } catch (e) {
      
    }
  }

  description (endpoint) {
    const description = rmMD(endpoint.description.split('\n')[0])
    const slug = endpoint.operationId.replace(/_/g, '-')
    const link = `https://developer.box.com/reference/${slug}`
    return `${description}\n\n${link}`
  }

  pruneEmptyFolders () {
    this.folders = this.folders.filter(folder => !folder.item || folder.item.length > 0)
  }

  sortVerbs () {
    this.folders.forEach(folder => {
      if (folder.item) {
        folder.item.sort((a, b) => VERB_PRIORITY.indexOf(a.request.method) - VERB_PRIORITY.indexOf(b.request.method))
      }
      return folder
    })
  }

  request (verb, path, endpoint) {
    return {
      id: uuid.v5(verb+'_'+path+'_'+endpoint,NAMESPACE), //RB: use uuid v5 to generate a deterministic uuid
      url: this.url(path, endpoint),
      auth: this.auth_for_endpoint(endpoint),
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
      host: `{{${server.host}}}`,
      path: this.path(server, path),
      query: this.query(endpoint),
      variable: this.variable(endpoint)
    }
  }

  path (server, path) {
    const result = resolve(`${server.pathname}${path}`)
    return result.replace(/\{(.*?)\}/g, ':$1').split('#')[0]
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
        value: this.serialize(param.name, param.example, param.explode),
        disabled: !param.required,
        description: param.description
      }))
  }

  serialize (key, value, explode = true) {
    if (['client_id', 'client_secret', 'refresh_token'].includes(key)) {
      return `{{${key}}}`
    } else if (!explode && Array.isArray(value)) {
      return value.join(',')
    } else if (typeof value === 'object' && value !== null && value !== undefined) {
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
        value: this.serialize(param.name, param.example),
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
          value: this.serialize(param.name, param.example),
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

  auth_for_endpoint (endpoint) {
    // RB: if multi then inherit security from parent collection
    if ( this.LOCALE === 'MULTI' ) { return null }
    if (endpoint.security && endpoint.security.length === 0) {
      return {
        type: 'noauth'
      }
    } else {
      return this.defaultAuth()
    }
  }

  defaultAuth () {
    // RB: if multi the collection has bearer token
    if ( this.LOCALE === 'MULTI' ) { return this.auth_bearer_token() }
    else { return this.auth_oAuth() }
  }

 auth_bearer_token(){
  return{
    type: "bearer", 
    bearer: [
      {
        key: 'token',
        value:'{{access_token}}',
        type: 'any'
      }

    ]
  }
 }

  auth_oAuth () {
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

  body (endpoint) {
    if (!(endpoint.requestBody && endpoint.requestBody.content)) { return null }

    const [contentType, content] = Object.entries(endpoint.requestBody.content)[0]

    return {
      mode: this.mode(contentType),
      raw: this.raw(content, contentType),
      urlencoded: this.urlencoded(content, contentType),
      formdata: this.formdata(content, contentType)
    }
  }

  mode (contentType) {
    const mapping = {
      'application/x-www-form-urlencoded': 'urlencoded',
      'multipart/form-data': 'formdata',
      'application/octet-stream': 'file',
      'application/json': 'raw',
      'application/json-patch+json': 'raw'
    }
    return mapping[contentType]
  }

  raw (content, contentType) {
    if (this.mode(contentType) !== 'raw' || !content.schema || !content.schema.properties) { return }
    return new Example(content.schema, this.openapi).stringify()
  }

  urlencoded (content, contentType) {
    if (this.mode(contentType) !== 'urlencoded' || !content.schema || !content.schema.properties) { return [] }

    return Object.entries(content.schema.properties)
      .map(([key, prop]) => ({
        key: key,
        value: this.serialize(key, prop.example),
        disabled: !content.schema.required.includes(key),
        description: prop.description
      }))
  }

  formdata (content, contentType) {
    if (this.mode(contentType) !== 'formdata' || !content.schema || !content.schema.properties) { return [] }

    return Object.entries(content.schema.properties).map(([key, prop]) => {
      const type = prop.format === 'binary' ? 'file' : 'text'
      const value = type === 'file' ? null : new Example(prop, this.openapi).stringify()
      const required = content.schema.required && content.schema.required.includes(key)

      return {
        key: key,
        value: this.serialize(key, value),
        disabled: !required,
        type: type,
        description: prop.description
      }
    })
  }

  response (endpoint) {
    return Object
      .entries(endpoint.responses)
      .filter(([code]) => code !== 'default')
      .map(([code, response]) => ({
        // id: uuid.v4(),
        id: uuid.v5(endpoint.operationId+'_'+code,NAMESPACE), //RB: use uuid v5 to generate a deterministic uuid
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
        value: this.serialize(name, header.example),
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
  findFolder (endpoint) {
    const id = endpoint['x-box-tag']

    // first find the folder name
    const folderName = this.openapi.tags.filter(tag =>
      tag['x-box-tag'] === id
    )[0].name

    // return the first folder to match this name
    return this.folders.filter(folder => folder.name === folderName)[0].item
  }

  /**
   * Adds a pre-request script to an API call
   */
  getItemEvents (endpoint) {
    // RB: Dont add a script for endpoints if multi collection
    if (this.LOCALE === 'MULTI') { return [] }
    // Don't add a script for endpoints without auth
    if (endpoint.operationId === 'post_oauth2_token#refresh') {
      return [this.testUpdateAccessToken()]
    } else if (endpoint.security && endpoint.security.length === 0) {
      return []
    } else {
      return [this.prerequestRefreshAccessToken()]
    }
  }

  /**
   * Creates a pre-request event for collection
   */
  collectionPreRequest () {
    return {
      listen: 'prerequest',
      script: {
        id: uuid.v4(),
        type: 'text/javascript',
        exec: [String(fs.readFileSync('./src/events/collectionPreReqScript.js'))]
      }
    }
  }

  /**
   * Creates a pre-request event to check for expired access tokens
   */
  prerequestRefreshAccessToken () {
    return {
      listen: 'prerequest',
      script: {
        id: uuid.v4(),
        type: 'text/javascript',
        exec: [String(fs.readFileSync('./src/events/refreshAccessToken.js'))]
      }
    }
  }

  /**
   * Creates a test event to pick up on refreshed access tokens
   */
  testUpdateAccessToken () {
    return {
      listen: 'test',
      script: {
        id: uuid.v4(),
        type: 'text/javascript',
        exec: [String(fs.readFileSync('./src/events/updateAccessToken.js'))]
      }
    }
  }
}

module.exports = Collection
