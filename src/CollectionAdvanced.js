require('dotenv').config()

const fs = require('fs')
const Utils = require('./Utils')
const { uniq } = require('lodash')

const Collection = require('./Collection')

/**
 * Our own opinionated OpenAPI to Postman converter
 * RB: This is the main class for the advanced collection
 * This class extends the Collection class
 * Main difference are:
 * - The collectionPreRequest() method - PreScript for the collection
 * - The authForEndPoint() method - All endpoints inherit from the collection
 * - The defaultAuth() method - Default auth for collection is now Bearer Token
 * - The getItemEvents() method - Items do not have events/scripts, these are inherited from the collection
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
    console.log('Processing collection')
    const info = this.getInfo()
    this.collectionId = info._postman_id
    const item = this.getItems()
    const event = [this.collectionPreRequest()]
    const variable = this.getVariables()
    const auth = this.defaultAuth()
    const localCollection = {
      info,
      item,
      event,
      variable,
      auth
    }

    // RB: inject utilities
    this.injectUtilities(localCollection)

    return localCollection
  }

  // PRIVATE

  /**
   * Extracts all server URLs as variables
   */
  getVariables () {
    const variables = uniq(Object.values(this.openapi.paths).flatMap(endpoints => (
      Object.values(endpoints).map(endpoint => this.server(endpoint).host)
    ))).map(host => ({
      id: Utils.GenID(host),
      key: host, // .replace(/\./g, '_'),
      value: host,
      type: 'string'
    }))
    // add a variable for each of the JWT JS 3rd party libraries
    const libJSRSASign = this.variableLibJaRsaSign()

    variables.push(libJSRSASign)
    return variables
  }

  injectUtilities (localCollection) {
    // insert Utils folder at top level item
    // TODO: Add proper description
    const folderUtilities = this.createFolder('(Utilities)', null, 'Utility scripts for Postman Collection')
    localCollection.item.unshift(folderUtilities)

    // insert create environment into Utils folder
    let description = "These requests will help you to create an environment that will support the automatic token request or refresh.\n\nFor this you'll need:\n\n- A Postman API key that you can configure in your account settings\n- The ID of your workspace (you can use the \"Get Workspaces\" request to list them all)\n    \n\nEach request will create the environment with the specific variables necessary for the token request or refresh.\n\nYou can fill in the required data on the request body, or alternatively, fill in the data in the environment.\n\nEither way this data will end up in your postman account.\n\nYou can create multiple environments for multiple Box Applications, and quickly switch between them.\n\n**Steps**:\n\n- Goto your account and under API keys generate a new api key\n- In Postman, under environments, global, create a variable named personal-pm-pmak as a secret and paste the PMAK you created in the previous step. Remember to save.\n- In this collection, under the create environments, use the get workspaces to identify the current workspace, and copy its id.\n- In. Postman, under environments, global, create a variable named wokspaceid and paste the id you copied from the previous step. Remember to save.\n    \n\nYou're all set."
    const folderCreateEnvironments = this.createFolder('Create Environments', folderUtilities.id, description)
    folderCreateEnvironments.auth = this.authAPIKey()
    folderCreateEnvironments.id = null
    folderCreateEnvironments.id = Utils.GenID(folderUtilities.id + JSON.stringify(folderCreateEnvironments))

    folderCreateEnvironments.item.push(this.endPointGetWorkspaces(folderCreateEnvironments.id))
    folderCreateEnvironments.item.push(this.endPointCreateBearerEnvironment(folderCreateEnvironments.id))
    folderCreateEnvironments.item.push(this.endPointCreateOAuthEnvironment(folderCreateEnvironments.id))
    folderCreateEnvironments.item.push(this.endPointCreateCCGEnvironment(folderCreateEnvironments.id))
    folderCreateEnvironments.item.push(this.endPointCreateJWTEnvironment(folderCreateEnvironments.id))

    localCollection.item.splice(1, 0, folderCreateEnvironments)

    // insert test environment into Utils folder
    description = 'Using the Box API /users/me is a good way to test if you can connect to the API.\n\nTo test the connectivity of the environment:\n\n- Select an environment\n- Execute the request\n    \n\nYou should get back details on the user who is logged in.'
    const folderTestEnvironments = this.createFolder('Test Environments', folderUtilities.id, description)
    folderTestEnvironments.item.push(this.endPointTestEnvironment(folderTestEnvironments.id))

    localCollection.item.splice(2, 0, folderTestEnvironments)

    // insert Authorize OAuth Box App Helper into Utils folder
    description = "I order to use OAuth 2.0, you must first authorize the application.\n\nYou also need to re-authorize the application if the refresh token has expired, which in case of Box is 60 days.\n\nTo use this you will need the following from your Box application:\n\n- Client ID\n- Client Secret\n- Redirect URI configured as: [https://oauth.pstmn.io/v1/callback](https://oauth.pstmn.io/v1/callback)\n    \n\nTo start the process:\n\n- Select an OAuth environment that has at least the client and secret id's\n- Open the authorization tab in Postman, scroll all the way down and press \"Get New Access Token\"\n    \n\nTo view the token retrieved using this helper:\n\n- Open this Authorization tab\n- Under. Current Token, Token\n    \n\nUpdate your OAuth environment settings with the information from this token:\n\n- Copy the access token to access token\n- Copy refresh token to refresh token\n- You can ignore the expire at\n- But you must set the refresh token expires at\n- Add 4,000,000 to the time stamp you got back\n    \n\nAs you use the api, new access and refresh tokens will be fetch automatically."
    const folderAuthorizeOAuthBoxAppHelper = this.createFolder('Authorize OAuth Box App Helper', folderUtilities.id, description)
    folderAuthorizeOAuthBoxAppHelper.auth = this.authOAuth2AutoRefresh()
    folderAuthorizeOAuthBoxAppHelper.id = null
    folderAuthorizeOAuthBoxAppHelper.id = Utils.GenID(folderUtilities.id + JSON.stringify(folderAuthorizeOAuthBoxAppHelper))

    localCollection.item.splice(3, 0, folderAuthorizeOAuthBoxAppHelper)

    return localCollection
  }

  authForEndPoint (endpoint) {
    // RB: All endpoints inherit from the collection
    return null
  }

  defaultAuth () {
    // RB: Default auth for collection is now Bearer Token
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

  authAPIKey () {
    return {
      type: 'apikey',
      apikey: [
        {
          key: 'value',
          value: '{{personal-pm-pmak}}'
        },
        {
          key: 'key',
          value: 'X-API-Key'
        }
      ]
    }
  }

  authOAuth2AutoRefresh () {
    return {
      type: 'oauth2',
      oauth2: [
        {
          key: 'clientSecret',
          value: '{{client_secret}}'
        },
        {
          key: 'clientId',
          value: '{{client_id}}'
        },
        {
          key: 'tokenName',
          value: 'Box OAuth Token'
        },
        {
          key: 'accessTokenUrl',
          value: 'https://{{api.box.com}}/oauth2/token'
        },
        {
          key: 'authUrl',
          value: 'https://{{account.box.com}}/api/oauth2/authorize'
        },
        {
          key: 'client_authentication',
          value: 'body'
        },
        {
          key: 'useBrowser',
          value: true
        },
        {
          key: 'addTokenTo',
          value: 'header'
        }
      ]
    }
  }

  /**
   * Adds a pre-request script to an API call
   */
  getItemEvents (endpoint, itemId) {
    // RB: Items do not have events/scripts, these are inherited from the collection
    return []
  }

  variableLibJaRsaSign () {
    const scriptString = String(fs.readFileSync('./src/events/libJsRSASign.min.js'))
    const libJSRSASign = {
      id: Utils.GenID('libJSRSASign'),
      key: 'libJSRSASign',
      value: scriptString,
      type: 'string'
    }
    const hash = this.calculateHash(scriptString)
    libJSRSASign.id = Utils.GenID(hash) // RB: to big for uuidv5
    return libJSRSASign
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

  // utilities end points from JSON file

  endPointGetWorkspaces (folderParentId) {
    const endPoint = {
      folder: folderParentId,
      name: 'Get Workspaces',
      description: "Gets all [workspaces](https://learning.postman.com/docs/collaborating-in-postman/using-workspaces/creating-workspaces/). The response includes your workspaces and any workspaces that you have access to.\n\n**Note:**\n\nThis endpoint's response contains the `visibility` field. [Visibility](https://learning.postman.com/docs/collaborating-in-postman/using-workspaces/managing-workspaces/#changing-workspace-visibility) determines who can access the workspace:\n\n- `personal` — Only you can access the workspace.\n- `team` — All team members can access the workspace.\n- `private` — Only invited team members can access the workspace ([Professional and Enterprise plans only](https://www.postman.com/pricing)).\n- `public` — Everyone can access the workspace.\n- `partner` — Only invited team members and [partners](https://learning.postman.com/docs/collaborating-in-postman/using-workspaces/partner-workspaces/) can access the workspace ([Enterprise Ultimate plans](https://www.postman.com/pricing) only).",
      method: 'GET',
      url: 'https://api.getpostman.com/workspaces',
      queryParams: [
        {
          key: 'type',
          value: '<string>',
          description: 'The type of workspace to filter the response by:\n\n* `personal`\n* `team`\n* `private`\n* `public`\n* `partner`',
          enabled: false
        },
        {
          key: 'include',
          value: '<string>',
          description: "Include the following information in the endpoint's response:\n- `mocks:deactivated` — Include all deactivated mock servers in the response.",
          enabled: false
        }
      ]
    }
    endPoint.id = Utils.GenID(folderParentId + JSON.stringify(endPoint))
    return endPoint
  }

  endPointCreateBearerEnvironment (folderParentId) {
    const endPoint = {
      name: 'Create Bearer Token Environment',
      dataMode: 'raw',
      rawModeData: '{\n    "environment": {\n        "name": "Box Bearer",\n        "values": [\n            {\n                "type": "secret",\n                "value": "",\n                "key": "access_token"\n            },\n            {\n                "type": "default",\n                "value": "BEARER",\n                "key": "box_env_type"\n            }\n        ]\n    }\n}',
      descriptionFormat: null,
      description: "Creates an environment. Include the following properties in the request body:\n\n* `name` — A **string** that contains the environment's name.\n\nYou can also include the following properties:\n\n* `values` — An array of objects that contains the following:\n    * `key` — The variable's name.\n    * `value` — The variable's value.\n    * `enabled` — If true, enable the variable.\n    * `type` — The variable's type. One of: `secret`, `default`, or `any`.",
      headers: 'Content-Type: application/json',
      method: 'POST',
      pathVariables: {},
      url: 'https://api.getpostman.com/environments?workspace={{wokspaceid}}',
      queryParams: [
        {
          key: 'workspace',
          value: '{{wokspaceid}}',
          equals: true,
          description: 'A workspace ID in which to create the environment.\n\nIf you do not include this query parameter, the system creates the environment in your "My Workspace" workspace.',
          enabled: true
        }
      ],
      headerData: [
        {
          key: 'Content-Type',
          value: 'application/json'
        }
      ],
      pathVariableData: [],
      dataDisabled: false,
      dataOptions: {
        raw: {}
      }
    }
    endPoint.id = Utils.GenID(folderParentId + JSON.stringify(endPoint))
    return endPoint
  }

  endPointCreateOAuthEnvironment (folderParentId) {
    const endPoint = {
      name: 'Create OAuth Environment',
      dataMode: 'raw',
      rawModeData: '{\n    "environment": {\n        "name": "Box OAuth",\n        "values": [\n            {\n                "type": "default",\n                "value": "YOU CLIENT ID GOES HERE",\n                "key": "client_id"\n            },\n            {\n                "type": "secret",\n                "value": "",\n                "key": "client_secret"\n            },\n            {\n                "type": "secret",\n                "value": "",\n                "key": "access_token"\n            },\n            {\n                "type": "default",\n                "value": "0",\n                "key": "expires_at"\n            },\n            {\n                "type": "secret",\n                "value": "",\n                "key": "refresh_token"\n            },\n            {\n                "type": "default",\n                "value": "0",\n                "key": "refresh_token_expires_at"\n            },\n            {\n                "type": "default",\n                "value": "OAUTH",\n                "key": "box_env_type"\n            }\n        ]\n    }\n}',
      descriptionFormat: null,
      description: "Creates an environment. Include the following properties in the request body:\n\n* `name` — A **string** that contains the environment's name.\n\nYou can also include the following properties:\n\n* `values` — An array of objects that contains the following:\n    * `key` — The variable's name.\n    * `value` — The variable's value.\n    * `enabled` — If true, enable the variable.\n    * `type` — The variable's type. One of: `secret`, `default`, or `any`.",
      headers: 'Content-Type: application/json',
      method: 'POST',
      pathVariables: {},
      url: 'https://api.getpostman.com/environments?workspace={{wokspaceid}}',
      queryParams: [
        {
          key: 'workspace',
          value: '{{wokspaceid}}',
          equals: true,
          description: 'A workspace ID in which to create the environment.\n\nIf you do not include this query parameter, the system creates the environment in your "My Workspace" workspace.',
          enabled: true
        }
      ],
      headerData: [
        {
          key: 'Content-Type',
          value: 'application/json'
        }
      ],
      pathVariableData: [],
      dataDisabled: false,
      dataOptions: {
        raw: {}
      }
    }
    endPoint.id = Utils.GenID(folderParentId + JSON.stringify(endPoint))
    return endPoint
  }

  endPointCreateCCGEnvironment (folderParentId) {
    const endPoint = {
      name: 'Create CCG Environment',
      dataMode: 'raw',
      rawModeData: '{\n    "environment": {\n        "name": "Box CCG",\n        "values": [\n            {\n                "type": "default",\n                "value": "YOU CLIENT ID GOES HERE",\n                "key": "client_id"\n            },\n            {\n                "type": "secret",\n                "value": "",\n                "key": "client_secret"\n            },\n            {\n                "type": "default",\n                "value": "enterprise",\n                "key": "box_subject_type"\n            },\n            {\n                "type": "default",\n                "value": "YOUR ENTERPRISE ID",\n                "key": "box_subject_id"\n            },\n            {\n                "type": "secret",\n                "value": "",\n                "key": "access_token"\n            },\n            {\n                "type": "default",\n                "value": "0",\n                "key": "expires_at"\n            },\n            {\n                "type": "default",\n                "value": "CCG",\n                "key": "box_env_type"\n            }\n        ]\n    }\n}',
      descriptionFormat: null,
      description: "Creates an environment. Include the following properties in the request body:\n\n* `name` — A **string** that contains the environment's name.\n\nYou can also include the following properties:\n\n* `values` — An array of objects that contains the following:\n    * `key` — The variable's name.\n    * `value` — The variable's value.\n    * `enabled` — If true, enable the variable.\n    * `type` — The variable's type. One of: `secret`, `default`, or `any`.",
      headers: 'Content-Type: application/json',
      method: 'POST',
      pathVariables: {},
      url: 'https://api.getpostman.com/environments?workspace={{wokspaceid}}',
      queryParams: [
        {
          key: 'workspace',
          value: '{{wokspaceid}}',
          equals: true,
          description: 'A workspace ID in which to create the environment.\n\nIf you do not include this query parameter, the system creates the environment in your "My Workspace" workspace.',
          enabled: true
        }
      ],
      headerData: [
        {
          key: 'Content-Type',
          value: 'application/json'
        }
      ],
      pathVariableData: [],
      dataDisabled: false,
      dataOptions: {
        raw: {}
      }
    }
    endPoint.id = Utils.GenID(folderParentId + JSON.stringify(endPoint))
    return endPoint
  }

  endPointCreateJWTEnvironment (folderParentId) {
    const endPoint = {
      name: 'Create JWT Environment',
      dataMode: 'raw',
      rawModeData: '{\n    "environment": {\n        "name": "Box JWT",\n        "values": [\n            {\n                "type": "default",\n                "value": "YOU CLIENT ID GOES HERE",\n                "key": "client_id"\n            },\n            {\n                "type": "secret",\n                "value": "",\n                "key": "client_secret"\n            },\n            {\n                "type": "default",\n                "value": "enterprise",\n                "key": "box_subject_type"\n            },\n            {\n                "type": "default",\n                "value": "YOUR ENTERPRISE ID",\n                "key": "box_subject_id"\n            },\n            {\n                "type": "default",\n                "value": "YOU KEY ID GOES HERE",\n                "key": "key_id"\n            },\n            {\n                "type": "secret",\n                "value": "",\n                "key": "private_key_encrypted"\n            },\n            {\n                "type": "secret",\n                "value": "",\n                "key": "private_key_passphrase"\n            },\n            {\n                "type": "secret",\n                "value": "",\n                "key": "access_token"\n            },\n            {\n                "type": "default",\n                "value": "0",\n                "key": "expires_at"\n            },\n            {\n                "type": "default",\n                "value": "JWT",\n                "key": "box_env_type"\n            }\n        ]\n    }\n}',
      descriptionFormat: null,
      description: "Creates an environment. Include the following properties in the request body:\n\n* `name` — A **string** that contains the environment's name.\n\nYou can also include the following properties:\n\n* `values` — An array of objects that contains the following:\n    * `key` — The variable's name.\n    * `value` — The variable's value.\n    * `enabled` — If true, enable the variable.\n    * `type` — The variable's type. One of: `secret`, `default`, or `any`.",
      headers: 'Content-Type: application/json',
      method: 'POST',
      pathVariables: {},
      url: 'https://api.getpostman.com/environments?workspace={{wokspaceid}}',
      queryParams: [
        {
          key: 'workspace',
          value: '{{wokspaceid}}',
          equals: true,
          description: 'A workspace ID in which to create the environment.\n\nIf you do not include this query parameter, the system creates the environment in your "My Workspace" workspace.',
          enabled: true
        }
      ],
      headerData: [
        {
          key: 'Content-Type',
          value: 'application/json'
        }
      ],
      pathVariableData: [],
      dataDisabled: false,
      dataOptions: {
        raw: {}
      }
    }
    endPoint.id = Utils.GenID(folderParentId + JSON.stringify(endPoint))
    return endPoint
  }

  endPointTestEnvironment (folderParentId) {
    const endPoint = {
      name: 'Test Environment',
      descriptionFormat: null,
      description: 'Retrieves information about the user who is currently authenticated.\n\nhttps://developer.box.com/reference/get-users-me',
      headers: '',
      method: 'GET',
      pathVariables: {},
      url: 'https://{{api.box.com}}/2.0/users/me?fields=id,type,name,login',
      queryParams: [],
      headerData: [],
      pathVariableData: [],
      dataDisabled: false
    }
    endPoint.id = Utils.GenID(folderParentId + JSON.stringify(endPoint))
    return endPoint
  }
}
module.exports = CollectionAdvanced
