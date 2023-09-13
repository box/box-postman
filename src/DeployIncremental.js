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

  console.log('Incremental deployment of collection ', localCollection.info.name, ' completed')
}

async function mergeFolders (remoteCollection, localCollection) {
  console.log('\t Folders:')

  const remoteFolders = remoteCollection.collection.item
    .map(folder => ({ id: folder.id, name: folder.name }))

  const localFolders = localCollection.item
  // .map(folder => ({ id: folder.id, name: folder.name }))

  // create new folders
  const newFolders = localFolders.filter(localFolder => !remoteFolders.find(remoteFolder => remoteFolder.id === localFolder.id))
  // console.log('newFolders: \n', newFolders)

  for (const folder of newFolders) {
    const msg = `\t\t Creating new folder ${folder.id} ${folder.name}`
    const resp = await new pmAPI.Folder(remoteCollection.collection.info.uid)
      .create(folder)
      .then(() => '[OK]')
    console.log(msg, resp)
  }

  // delete olds folders
  const oldFolders = remoteFolders.filter(remoteFolder => !localFolders.find(localFolder => localFolder.id === remoteFolder.id))
  // console.log('oldFolders: \n', oldFolders)
  for (const folder of oldFolders) {
    const msg = `\t\t Deleting old folder ${folder.id} ${folder.name}`
    const resp = await new pmAPI.Folder(remoteCollection.collection.info.uid)
      .delete(folder.id)
      .then(() => '[OK]')
    console.log(msg, resp)
  }
}

async function mergeRequests (remoteCollection, localCollection) {
  console.log('\t Requests:')
  const remoteFoldersRequest = remoteCollection.collection.item
    .map(folder => ({ id: folder.id, name: folder.name, item: folder.item }))

  const localFoldersRequest = localCollection.item
    .map(folder => ({ id: folder.id, name: folder.name, item: folder.item }))

  // loop folders
  for (const localFolder of localFoldersRequest) {
    const remoteRequests = remoteFoldersRequest.find(remoteFolder => remoteFolder.id === localFolder.id).item
    const localRequests = localFolder.item
    console.log('\t\t Folder: ', localFolder.name)

    // create new rewuests
    const newRequests = localRequests.filter(localRequest => !remoteRequests.find(remoteRequest => remoteRequest.id === localRequest.id))

    for (const request of newRequests) {
      const pmRequest = pmConvert.requestFromLocal(request)
      const msg = `\t\t\t Creating new request ${request.id} ${request.name}`
      // console.log('request: \n', JSON.stringify(request, 2))
      const resp = await new pmAPI.Request(remoteCollection.collection.info.uid)
        .create(pmRequest, localFolder.id)
        .then(() => '[OK]')
      console.log(msg, resp)
    }

    // delete olds requests
    const oldRequests = remoteRequests.filter(remoteRequest => !localRequests.find(localRequest => localRequest.id === remoteRequest.id))
    for (const request of oldRequests) {
      const msg = `\t\t\t Deleting old request ${request.id} ${request.name}`
      const resp = await new pmAPI.Request(remoteCollection.collection.info.uid)
        .delete(request.id)
        .then(() => '[OK]')
      console.log(msg, resp)
    }
  }
}

module.exports = {
  deployIncremental
}
