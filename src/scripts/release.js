require('dotenv').config()

const fs = require('fs')
// const oldDeploy = require('../OldDeployBulk')
const deployBulk = require('../DeployBulk')
const OUTPUT_FOLDER = './compiled'

const release = async (locale = process.argv[1]) => {
  const collection = JSON.parse(fs.readFileSync(`${OUTPUT_FOLDER}/collection.${locale}.json`).toString())
  const privateRemoteCollectionId = process.env[`PRIVATE_${locale.toUpperCase()}_POSTMAN_COLLECTION_ID`]
  const publicRemoteCollectionId = process.env[`PUBLIC_${locale.toUpperCase()}_POSTMAN_COLLECTION_ID`]

  // oldDeploy.oldDeployBulk(publicRemoteCollectionID, collection, publicRemoteCollectionID)
  await deployBulk.deployCollectionHead(privateRemoteCollectionId, collection)
  await deployBulk.deployCollectionFull(privateRemoteCollectionId, collection, publicRemoteCollectionId)
}

const releaseAll = async () => {
  const locales = process.env.LOCALES.split(',')
  return Promise.all(locales.map(locale => release(locale)))
}

module.exports = {
  release,
  releaseAll
}
