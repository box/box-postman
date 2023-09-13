require('dotenv').config()

const fs = require('fs')
const deploy = require('../DeployBulk')
const OUTPUT_FOLDER = './compiled'

const release = async (locale = process.argv[1]) => {
  const collection = JSON.parse(fs.readFileSync(`${OUTPUT_FOLDER}/collection.${locale}.json`).toString())
  const collectionId = process.env[`${locale.toUpperCase()}_POSTMAN_COLLECTION_ID`]
  deploy.deployBulk(collectionId, collection)
}

const releaseAll = async () => {
  const locales = process.env.LOCALES.split(',')
  return Promise.all(locales.map(locale => release(locale)))
}

module.exports = {
  release,
  releaseAll
}
