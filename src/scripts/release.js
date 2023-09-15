require('dotenv').config()

const fs = require('fs')
const oldDeploy = require('../OldDeployBulk')
const OUTPUT_FOLDER = './compiled'

const release = async (locale = process.argv[1]) => {
  const collection = JSON.parse(fs.readFileSync(`${OUTPUT_FOLDER}/collection.${locale}.json`).toString())
  // const privateRemoteCollectionID = process.env[`PRIVATE_${locale.toUpperCase()}_POSTMAN_COLLECTION_ID`]
  const publicRemoteCollectionID = process.env[`PUBLIC_${locale.toUpperCase()}_POSTMAN_COLLECTION_ID`]

  oldDeploy.oldDeployBulk(publicRemoteCollectionID, collection, publicRemoteCollectionID)
}

const releaseAll = async () => {
  const locales = process.env.LOCALES.split(',')
  return Promise.all(locales.map(locale => release(locale)))
}

module.exports = {
  release,
  releaseAll
}
