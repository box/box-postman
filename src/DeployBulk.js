// const pmConvert = require('./PostmanConversions')
const pmAPI = require('./postmanAPI')

const deployCollectionHead = async (privateRemoteCollectionID, localCollection) => {
  const collectionHead = { ...localCollection }
  collectionHead.item = []
  const msg = `\nDeploying collection head ${collectionHead.info.name} to ${privateRemoteCollectionID}`
  console.log(msg + '...')
  await new pmAPI.Collection(privateRemoteCollectionID)
    .update({ collection: collectionHead })
    .then(() => { console.log(msg, '-> OK\n') })
    .catch((error) => {
      console.log(msg, '-> FAIL')
      handlePostmanAPIError(error)
    })
}

const deployCollectionFull = async (privateRemoteCollectionId, localCollection, publicRemoteCollectionId) => {
  let msg = `\nDeploying full collection ${localCollection.info.name} to ${privateRemoteCollectionId}`
  console.log(msg + '...')
  await new pmAPI.Collection(privateRemoteCollectionId)
    .update({ collection: localCollection })
    .then(() => { console.log(msg, '-> OK\n') })
    .catch((error) => {
      console.log(msg, '-> FAIL')
      handlePostmanAPIError(error)
    })

  msg = 'Merging to public collection'
  console.log('\n' + msg + '...')
  await new pmAPI.Collection(privateRemoteCollectionId).merge(publicRemoteCollectionId)
    .then(() => { console.log(msg, '-> OK\n') })
    .catch((error) => {
      console.log(msg, '-> FAIL')
      handlePostmanAPIError(error)
    })
}

// Handle axios error
const handlePostmanAPIError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log('API ERROR:', error.response.data)
  } else {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log('NO RESPONSE:', error.message)
    if (error.cause) {
      console.log('CAUSE:', error.cause)
    }
  }
  // const { method, url, data } = error.config
  // console.log('REQUEST DETAILS', { method, url, data })
  process.exit(1)
}

module.exports = {
  deployCollectionHead,
  deployCollectionFull
}
