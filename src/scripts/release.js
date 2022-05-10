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

  // console.log('Empty Collection:',{ collection: emptyCollection })

  // first publish an empty collection to ensure all folders are removed
  await axios.put(
    `https://api.getpostman.com/collections/${collectionId}`,
    // JSON.stringify({ collection: emptyCollection}),
    { collection: emptyCollection },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.POSTMAN_API_KEY
      }
    }
  ).then(function () {
    console.log('EMPTY COLLECTION PUT OK', locale)
    // then publish the new collection
    axios.put(
      `https://api.getpostman.com/collections/${collectionId}`,
      // JSON.stringify({ collection }),
      { collection },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': process.env.POSTMAN_API_KEY
        }
      }
    ).then(function () {
      console.log('FULL COLLECTION PUT OK', locale)
    }
    ).catch(function (error) {
      // console.dir(error.response, { depth: 100 })
      logAxiosError(error)
      // throw error
    }
    )
  }
  ).catch(function (error) {
    // console.dir(error.response, { depth: 100 })
    logAxiosError(error)
    // throw error
  }
  )
}

function logAxiosError (error) {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log('ERROR DATA', error.response.data)
    console.log('ERROR STATUS', error.response.status)
    console.log('ERROR HEADERS', error.response.headers)
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log('ERROR REQUEST', error.request)
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log('ERROR MESSAGE', error.message)
  }
  console.log('ERROR CONFIG', error.config)
  process.exit(1)
}

const releaseAll = async () => {
  const locales = process.env.LOCALES.split(',')
  return Promise.all(locales.map(locale => release(locale)))
}

module.exports = {
  release,
  releaseAll
}
