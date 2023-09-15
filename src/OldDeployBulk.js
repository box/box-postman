// Deploy collection in bulks
// --------------------------------------------------------------
// Use the collection PUT to deploy the new collection in bulk
// using the constructed collection from the previous step.
// It first updates the collection with an empty collection
// to remove all folders and requests.
// Then it updates the collection with the new collection
// to add all folders and requests.
// ------------------------------------------------------------
// We beleive this to be the source of the problem, where
// erractic behaviour is observed when deploying the collection
// in bulk, with an HTTP 500 server error.
// ------------------------------------------------------------

const axios = require('axios')

const oldDeployBulk = async (collectionId, localCollection) => {
// prevent old folders from remaining in place by first removing all items
  const emptyCollection = { ...localCollection }
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
  })
    .then(function () {
      console.log('EMPTY COLLECTION PUT OK: ', localCollection.info.name)
      // then publish the new collection
      axios.put(
      `https://api.getpostman.com/collections/${collectionId}`,
      // JSON.stringify({ collection }),
      { collection: localCollection },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': process.env.POSTMAN_API_KEY
        }
      })
        .then(function () {
          console.log('FULL COLLECTION PUT OK:', localCollection.info.name)
        }
        )
        .catch(function (error) {
        // console.dir(error.response, { depth: 100 })
          logAxiosError(error)
        // throw error
        })
    })
    .catch(function (error) {
      // console.dir(error.response, { depth: 100 })
      logAxiosError(error)
      // throw error
    })
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
  // console.log('ERROR CONFIG', error.config)
  process.exit(1)
}

module.exports = {
  oldDeployBulk
}
