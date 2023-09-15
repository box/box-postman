require('dotenv').config()

const fs = require('fs')
const { deployIncremental } = require('../DeployIncremental')

const OUTPUT_FOLDER = './compiled'

const release = async (locale = process.argv[1]) => {
  const localCollection = JSON.parse(fs.readFileSync(`${OUTPUT_FOLDER}/collection.advanced.${locale}.json`).toString())
  const privateRemoteCollectionId = process.env[`PRIVATE_${locale.toUpperCase()}_POSTMAN_COLLECTION_ADVANCED_ID`]
  const publicRemoteCollectionId = process.env[`PUBLIC_${locale.toUpperCase()}_POSTMAN_COLLECTION_ADVANCED_ID`]
  await deployIncremental(privateRemoteCollectionId, localCollection, publicRemoteCollectionId)
}

const releaseAll = async () => {
  const locales = process.env.LOCALES.split(',')
  return Promise.all(locales.map(locale => release(locale)))
}

module.exports = {
  release,
  releaseAll
}
