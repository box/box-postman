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
  const remoteFolders = remoteCollection.collection.item
    .map(folder => ({ id: folder.id, name: folder.name }))
  const localFolders = localCollection.item

  const newFolders = localFolders.filter(localFolder => !remoteFolders.find(remoteFolder => remoteFolder.id === localFolder.id))
  const oldFolders = remoteFolders.filter(remoteFolder => !localFolders.find(localFolder => localFolder.id === remoteFolder.id))

  if (newFolders.length === 0 && oldFolders.length === 0) {
    console.log(' Deploying Folders: No changes')
    return
  }
  console.log(' Deploying Folders:')

  let hasChanges = false

  // create new folders
  for (const folder of newFolders) {
    const msg = `  Creating new folder [${folder.name}]`
    await new pmAPI.Folder(remoteCollection.collection.info.uid)
      .create(folder)
      .then(() => { console.log(msg, '-> OK') })
      .catch((error) => {
        console.log(msg, '-> FAIL')
        handlePostmanAPIError(error)
      })
    hasChanges = true
  }

  // delete old folders
  for (const folder of oldFolders) {
    const msg = `  Deleting old folder [${folder.name}]`
    await new pmAPI.Folder(remoteCollection.collection.info.uid)
      .delete(folder.id)
      .then(() => { console.log(msg, '-> OK') })
      .catch((error) => {
        console.log(msg, '-> FAIL')
        handlePostmanAPIError(error)
      })
    hasChanges = true
  }

  // sort folders
  // this doesnt work, the API does not support moving folders
  if (hasChanges) {
    // const tmpRootFolder = await new pmAPI.Folder(remoteCollection.collection.info.uid).create({ name: 'tmpRootFolder' })
    // refresh remote collection
    // remoteCollection = await new pmAPI.Collection(remoteCollection.collection.info.uid).get()
    // for each remote folder transfer them to the tmpRootFolder

    //
    // for (const folder of remoteCollection.collection.item) {
    //   await new pmAPI.Folder(remoteCollection.collection.info.uid)
    //     .update(folder.id, { folder: tmpRootFolder.data.id })
    //     .catch((error) => {
    //       console.log('  Moving folder', folder.name, 'to tmpRootFolder -> FAIL')
    //       handlePostmanAPIError(error)
    //     })
    // }
  }
}

async function mergeRequests (remoteCollection, localCollection) {
  const remoteFoldersRequest = remoteCollection.collection.item
    .map(folder => ({ id: folder.id, name: folder.name, item: folder.item }))
  const localFoldersRequest = localCollection.item
    .map(folder => ({ id: folder.id, name: folder.name, item: folder.item }))

  console.log('\n Deploying Requests:')

  // loop folders
  for (const localFolder of localFoldersRequest) {
    const remoteRequests = remoteFoldersRequest.find(remoteFolder => remoteFolder.id === localFolder.id).item
    const localRequests = localFolder.item

    // create new requests
    const newRequests = localRequests.filter(localRequest => !remoteRequests.find(remoteRequest => remoteRequest.id === localRequest.id))
    const oldRequests = remoteRequests.filter(remoteRequest => !localRequests.find(localRequest => localRequest.id === remoteRequest.id))

    if (newRequests.length === 0 && oldRequests.length === 0) {
    //   console.log('  In Folder: ', localFolder.name, '-> No changes')
      continue
    }
    console.log('  In Folder: ', localFolder.name)

    // create new requests
    let hasChanges = false
    for (const request of newRequests) {
      const pmRequest = pmConvert.requestFromLocal(request)
      const msg = `   Creating new request [${request.name}]`
      // console.log('request: \n', JSON.stringify(request, 2))
      await new pmAPI.Request(remoteCollection.collection.info.uid)
        .create(pmRequest, localFolder.id)
        .then(() => { console.log(msg, '-> OK') })
        .catch((error) => {
          console.log(msg, '-> FAIL')
          handlePostmanAPIError(error)
        })
      hasChanges = true
    }

    // delete old requests
    for (const request of oldRequests) {
      const msg = `   Deleting old request [${request.name}]`
      await new pmAPI.Request(remoteCollection.collection.info.uid)
        .delete(request.id)
        .then(() => { console.log(msg, '-> OK') })
        .catch((error) => {
          console.log(msg, '-> FAIL')
          handlePostmanAPIError(error)
        })
      hasChanges = true
    }

    if (hasChanges) {
      // sort requests in folder
      const order = localRequests.map(request => request.id)
      const msg = `   Sorting requests in folder [${localFolder.name}]`
      await new pmAPI.Folder(remoteCollection.collection.info.uid)
        .update(localFolder.id, { order })
        .then(() => { console.log(msg, '-> OK') })
        .catch((error) => {
          console.log(msg, '-> FAIL')
          handlePostmanAPIError(error)
        })
    }
  }
}

async function mergeResponses (remoteCollection, localCollection) {
  console.log('\n Deploying Response:')
  const remoteFoldersRequest = remoteCollection.collection.item
    .map(folder => ({ id: folder.id, name: folder.name, item: folder.item }))

  const localFoldersRequest = localCollection.item
    .map(folder => ({ id: folder.id, name: folder.name, item: folder.item }))

  // loop folders
  for (const localFolder of localFoldersRequest) {
    const remoteRequests = remoteFoldersRequest.find(remoteFolder => remoteFolder.id === localFolder.id).item
    const localRequests = localFolder.item
    console.log('  In Folder: ', localFolder.name)
    // loop requests
    for (const localRequest of localRequests) {
      const remoteResponses = remoteRequests.find(remoteRequest => remoteRequest.id === localRequest.id).response
      const localResponses = localRequest.response

      const newResponses = localResponses.filter(localResponse => !remoteResponses.find(remoteResponse => remoteResponse.id === localResponse.id))
      const oldResponses = remoteResponses.filter(remoteResponse => !localResponses.find(localResponse => localResponse.id === remoteResponse.id))

      if (newResponses.length === 0 && oldResponses.length === 0) {
        continue
      }
      console.log('   In Request: ', localRequest.name)
      let hasChanges = false

      // create new responses
      for (const response of newResponses) {
        const pmResponse = pmConvert.responseFromLocal(response)
        const msg = `    Creating new response [${response.code} ${response.status}]`
        await new pmAPI.Response(remoteCollection.collection.info.uid)
          .create(pmResponse, localRequest.id)
          .then(() => { console.log(msg, '-> OK') })
          .catch((error) => {
            console.log(msg, '-> FAIL')
            handlePostmanAPIError(error)
          })
        hasChanges = true
      }

      // delete old responses
      for (const response of oldResponses) {
        const msg = `    Deleting old response [${response.code} ${response.status}]`
        await new pmAPI.Response(remoteCollection.collection.info.uid)
          .delete(response.id)
          .then(() => { console.log(msg, '-> OK') })
          .catch((error) => {
            console.log(msg, '-> FAIL')
            handlePostmanAPIError(error)
          })
        hasChanges = true
      }

      // updating the requests with the order of the responses, doesn't seem to be necessary
      if (hasChanges) {
        // sort responses in requests
        const responsesOrder = localResponses.map(response => response.id)
        const msg = `   Sorting responses in request [${localRequest.name}]`
        await new pmAPI.Request(remoteCollection.collection.info._postman_id)
          .update(localRequest.id,
            {
              responses_order: responsesOrder
            })
          .then(() => { console.log(msg, '-> OK') })
          .catch((error) => {
            console.log(msg, '-> FAIL')
            handlePostmanAPIError(error)
          })
      }
    }
  }
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
    console.log('NO RESPONSE:', error.cause)
  }
  const { method, url, data } = error.config
  console.log('REQUEST DETAILS', { method, url, data })
  process.exit(1)
}

module.exports = {
  deployIncremental
}
