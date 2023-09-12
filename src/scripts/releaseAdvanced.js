require('dotenv').config()

const fs = require('fs')
const pmAPI = require('../postmanAPI')
const pmConvert = require('../PostmanCovertions')

const OUTPUT_FOLDER = './compiled'

const release = async (locale = process.argv[1]) => {
  const localCollection = JSON.parse(fs.readFileSync(`${OUTPUT_FOLDER}/collection.advanced.${locale}.json`).toString())
  const remoteCollectionID = process.env[`${locale.toUpperCase()}_POSTMAN_COLLECTION_ADVANCED_ID`]

  let remoteCollection = await new pmAPI.Collection(remoteCollectionID).get()
  console.log('Merging folders...')
  await mergeFolders(remoteCollection, localCollection)

  console.log('Merging requests...')
  remoteCollection = await new pmAPI.Collection(remoteCollectionID).get()
  await mergeRequests(remoteCollection, localCollection)
}

async function mergeFolders (remoteCollection, localCollection) {
  const remoteFolders = remoteCollection.collection.item
    .map(folder => ({ id: folder.id, name: folder.name }))

  const localFolders = localCollection.item
  // .map(folder => ({ id: folder.id, name: folder.name }))

  // const localFoldersx = Object.entries(localCollection.item).filter(([key, value]) => key !== 'item')

  // console.log('remoteFolders: \n', remoteFolders)
  // console.log('localFolders: \n', localFolders)

  // create new folders
  const newFolders = localFolders.filter(localFolder => !remoteFolders.find(remoteFolder => remoteFolder.id === localFolder.id))
  // console.log('newFolders: \n', newFolders)

  for (const folder of newFolders) {
    const msg = `Creating folder ${folder.id} ${folder.name} \t`
    const resp = await new pmAPI.Folder(remoteCollection.collection.info.uid)
      .create(folder)
      .then(() => 'OK')
      .catch((error) => error)
    console.log(msg, resp)
  }

  // delete olds folders
  const oldFolders = remoteFolders.filter(remoteFolder => !localFolders.find(localFolder => localFolder.id === remoteFolder.id))
  // console.log('oldFolders: \n', oldFolders)
  for (const folder of oldFolders) {
    const msg = `Deleting old folder ${folder.id} ${folder.name} \t`
    const resp = await new pmAPI.Folder(remoteCollection.collection.info.uid)
      .delete(folder.id)
      .then(() => 'OK')
      .catch((error) => 'FAIL ' + error)
    console.log(msg, resp)
  }
}

async function mergeRequests (remoteCollection, localCollection) {
  const remoteFoldersRequest = remoteCollection.collection.item
    .map(folder => ({ id: folder.id, name: folder.name, item: folder.item }))

  const localFoldersRequest = localCollection.item
    .map(folder => ({ id: folder.id, name: folder.name, item: folder.item }))

  // loop folders
  for (const localFolder of localFoldersRequest) {
    const remoteRequests = remoteFoldersRequest.find(remoteFolder => remoteFolder.id === localFolder.id).item
    const localRequests = localFolder.item

    // create new rewuests
    const newRequests = localRequests.filter(localRequest => !remoteRequests.find(remoteRequest => remoteRequest.id === localRequest.id))

    for (const request of newRequests) {
      const pmRequest = pmConvert.requestFromLocal(request)
      const msg = `Creating request ${request.id} ${request.name} \t`
      // console.log('request: \n', JSON.stringify(request, 2))
      const resp = await new pmAPI.Request(remoteCollection.collection.info.uid)
        .create(pmRequest, localFolder.id)
        .then(() => 'OK')
        .catch((error) => error)
      console.log(msg, resp)
    }

    // delete olds requests
    const oldRequests = remoteRequests.filter(remoteRequest => !localRequests.find(localRequest => localRequest.id === remoteRequest.id))
    for (const request of oldRequests) {
      const msg = `Deleting old request ${request.id} ${request.name} \t`
      const resp = await new pmAPI.Request(remoteCollection.collection.info.uid)
        .delete(request.id)
        .then(() => 'OK')
        .catch((error) => 'FAIL ' + error)
      console.log(msg, resp)
    }
  }
}

const releaseAll = async () => {
  const locales = process.env.LOCALES.split(',')
  return Promise.all(locales.map(locale => release(locale)))
}

module.exports = {
  release,
  releaseAll
}
