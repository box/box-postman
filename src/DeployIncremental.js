// Deploy collection inncrementally
// ---------------------------------------------------------------
// Cycle through the collection objects and deploy them one by one
// ---------------------------------------------------------------
// Folders -> Requests -> Responses
// ---------------------------------------------------------------
// An updated object has a different id.
// If the id matches, then the object is unchanged.
// If the id does not match, then the object is new.
// In the end delete all objects that are not in the updated collection.
// Sort the objects and update the parent order property.
// ---------------------------------------------------------------
// Except for folders which would force the update of the entire collection.
// ---------------------------------------------------------------

const pmConvert = require('./PostmanCovertions')
const pmAPI = require('./postmanAPI')

const deployIncremental = async (remoteCollectionID, localCollection) => {
  console.log('Incremental deployment of collection ', localCollection.info.name)

  let remoteCollection = await new pmAPI.Collection(remoteCollectionID).get()
  await mergeFolders(remoteCollection, localCollection)

  remoteCollection = await new pmAPI.Collection(remoteCollectionID).get()
  await mergeRequests(remoteCollection, localCollection)

  remoteCollection = await new pmAPI.Collection(remoteCollectionID).get()
  await mergeResponses(remoteCollection, localCollection)

  console.log('Incremental deployment of collection ', localCollection.info.name, ' completed')
}

async function mergeFolders (remoteCollection, localCollection) {
  console.log('\t Updating Folders:')

  const remoteFolders = remoteCollection.collection.item
    .map(folder => ({ id: folder.id, name: folder.name }))

  const localFolders = localCollection.item
  // .map(folder => ({ id: folder.id, name: folder.name }))

  // create new folders
  const newFolders = localFolders.filter(localFolder => !remoteFolders.find(remoteFolder => remoteFolder.id === localFolder.id))
  // console.log('newFolders: \n', newFolders)

  for (const folder of newFolders) {
    const msg = `\t\t Creating new folder ${folder.id} ${folder.name}`
    await new pmAPI.Folder(remoteCollection.collection.info.uid)
      .create(folder)
      .then(() => '[OK]')
      .catch((error) => {
        console.log(msg, '[FAIL]')
        handlePostmanAPIError(error)
      })
  }

  // delete olds folders
  const oldFolders = remoteFolders.filter(remoteFolder => !localFolders.find(localFolder => localFolder.id === remoteFolder.id))
  // console.log('oldFolders: \n', oldFolders)
  for (const folder of oldFolders) {
    const msg = `\t\t Deleting old folder ${folder.id} ${folder.name}`
    await new pmAPI.Folder(remoteCollection.collection.info.uid)
      .delete(folder.id)
      .then(() => '[OK]')
      .catch((error) => {
        console.log(msg, '[FAIL]')
        handlePostmanAPIError(error)
      })
  }
}

async function mergeRequests (remoteCollection, localCollection) {
  console.log('\t Updating Requests:')
  const remoteFoldersRequest = remoteCollection.collection.item
    .map(folder => ({ id: folder.id, name: folder.name, item: folder.item }))

  const localFoldersRequest = localCollection.item
    .map(folder => ({ id: folder.id, name: folder.name, item: folder.item }))

  // loop folders
  for (const localFolder of localFoldersRequest) {
    const remoteRequests = remoteFoldersRequest.find(remoteFolder => remoteFolder.id === localFolder.id).item
    const localRequests = localFolder.item
    console.log('\t\t In Folder: ', localFolder.name)

    // create new requests
    const newRequests = localRequests.filter(localRequest => !remoteRequests.find(remoteRequest => remoteRequest.id === localRequest.id))

    for (const request of newRequests) {
      const pmRequest = pmConvert.requestFromLocal(request)
      const msg = `\t\t\t Creating new request ${request.id} ${request.name}`
      // console.log('request: \n', JSON.stringify(request, 2))
      await new pmAPI.Request(remoteCollection.collection.info.uid)
        .create(pmRequest, localFolder.id)
        .then(() => '[OK]')
        .catch((error) => {
          console.log(msg, '[FAIL]')
          handlePostmanAPIError(error)
        })
    }

    // delete old requests
    const oldRequests = remoteRequests.filter(remoteRequest => !localRequests.find(localRequest => localRequest.id === remoteRequest.id))
    for (const request of oldRequests) {
      const msg = `\t\t\t Deleting old request ${request.id} ${request.name}`
      await new pmAPI.Request(remoteCollection.collection.info.uid)
        .delete(request.id)
        .then(() => '[OK]')
        .catch((error) => {
          console.log(msg, '[FAIL]')
          handlePostmanAPIError(error)
        })
    }

    // sort requests in folder
    const order = localRequests.map(request => request.id)
    // console.log('Local requests id: ', localRequestsId)
    const msg = `\t\t\t Sorting requests in folder ${localFolder.name}`
    await new pmAPI.Folder(remoteCollection.collection.info.uid)
      .update(localFolder.id, { order })
      .then(() => '[OK]')
      .catch((error) => {
        console.log(msg, '[FAIL]')
        handlePostmanAPIError(error)
      })
  }
}

async function mergeResponses (remoteCollection, localCollection) {
  console.log('\t Updating Requests:')
  const remoteFoldersRequest = remoteCollection.collection.item
    .map(folder => ({ id: folder.id, name: folder.name, item: folder.item }))

  const localFoldersRequest = localCollection.item
    .map(folder => ({ id: folder.id, name: folder.name, item: folder.item }))

  // loop folders
  for (const localFolder of localFoldersRequest) {
    const remoteRequests = remoteFoldersRequest.find(remoteFolder => remoteFolder.id === localFolder.id).item
    const localRequests = localFolder.item
    console.log('\t\t In Folder: ', localFolder.name)
    // loop requests
    for (const localRequest of localRequests) {
      const remoteResponses = remoteRequests.find(remoteRequest => remoteRequest.id === localRequest.id).response
      const localResponses = localRequest.response
      console.log('\t\t\t In Request: ', localRequest.name)

      // create new responses
      const newResponses = localResponses.filter(localResponse => !remoteResponses.find(remoteResponse => remoteResponse.id === localResponse.id))
      for (const response of newResponses) {
        const pmResponse = pmConvert.responseFromLocal(response)
        const msg = `\t\t\t\t Creating new response ${response.id} ${response.code} ${response.status}`
        await new pmAPI.Response(remoteCollection.collection.info.uid)
          .create(pmResponse, localRequest.id)
          .then(() => '[OK]')
          .catch((error) => {
            console.log(msg, '[FAIL]')
            handlePostmanAPIError(error)
          })
      }

      // delete old responses
      const oldResponses = remoteResponses.filter(remoteResponse => !localResponses.find(localResponse => localResponse.id === remoteResponse.id))
      for (const response of oldResponses) {
        const msg = `\t\t\t\t Deleting old response ${response.id} ${response.code} ${response.status}`
        await new pmAPI.Response(remoteCollection.collection.info.uid)
          .delete(response.id)
          .then(() => '[OK]')
          .catch((error) => {
            console.log(msg, '[FAIL]')
            handlePostmanAPIError(error)
          })
      }
    }
  }
}

// log axios error
const handlePostmanAPIError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log('API ERROR:', error.response.data)
  } else {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log('NO RESPONSE:', error.cause)
  }
  const { method, url, data } = error.config
  console.log('REQUEST DETAILS', { method, url, data })
  process.exit(1)
}

module.exports = {
  deployIncremental
}
