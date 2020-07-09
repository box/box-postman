require('dotenv').config()

const fs = require('fs')
const axios = require('axios')

const OUTPUT_FOLDER = './compiled'

const release = async (locale = process.argv[1]) => {
  const collection = JSON.parse(fs.readFileSync(`${OUTPUT_FOLDER}/collection.${locale}.json`).toString())
  const collectionId = process.env[`${locale.toUpperCase()}_POSTMAN_COLLECTION_ID`]

  // prevent old folders from remaining in place by first removing all items
  const emptyCollection = { ...collection }
  emptyCollection.item = []

  // first publish an empty collection to ensure all folders are removed
  await axios.put(
    `https://api.getpostman.com/collections/${collectionId}`,
    JSON.stringify({ collection: emptyCollection }),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.POSTMAN_API_KEY
      }
    }
  ).catch(error => console.dir(error.response, { depth: 100 }))

  // then publish the new collection
  await axios.put(
    `https://api.getpostman.com/collections/${collectionId}`,
    JSON.stringify({ collection }),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.POSTMAN_API_KEY
      }
    }
  ).catch(error => console.dir(error.response, { depth: 100 }))
}

const releaseAll = async () => {
  const locales = process.env.LOCALES.split(',')
  return Promise.all(locales.map(locale => release(locale)))
}

module.exports = {
  release,
  releaseAll
}
