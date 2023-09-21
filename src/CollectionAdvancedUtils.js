// Utitlity objects specific for Postman Collection
// These are not related with the Box Platform API
// Therefor they are not in the OpenAPI json
//
// These can be injected in using a flag in via the DeploymentIcremental.js script
// and should be invoked in the releaseAdvanced.js script
const Utils = require('./Utils')

const injectUtils = (localCollection) => {
  // insert Utils folder at top level item
  localCollection.item.unshift(genFolder('(Utilities)', 'Utility scripts for Postman Collection'))

  return localCollection
}

const genFolder = (name, description) => {
  const folder = {
    name,
    description
  }
  folder.id = Utils.GenID(JSON.stringify(folder))
  return folder
}

module.exports = {
  injectUtils
}
