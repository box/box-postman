require('dotenv').config()

const fs = require('fs')
const pmAPI = require('../postmanAPI')

const OUTPUT_FOLDER = './compiled'

const release = async (locale = process.argv[1]) => {
  const localCollection = JSON.parse(fs.readFileSync(`${OUTPUT_FOLDER}/collection.advanced.${locale}.json`).toString())
  const remoteCollectionID = process.env[`${locale.toUpperCase()}_POSTMAN_COLLECTION_ADVANCED_ID`]

  const remoteCollection = await new pmAPI.Collection(remoteCollectionID).get()

  // console.log('remoteCollection: \n', remoteCollection)

  // console.log('localCollection: \n', localCollection)

  // for (const folder of remoteCollection.collection.item) {
  //   console.log(`${folder.id} ${folder.name}`)
  // }
  mergeFolders(remoteCollection, localCollection)
}

async function mergeFolders (remoteCollection, localCollection) {
  const remoteFolders = remoteCollection.collection.item.map(folder => ({ id: folder.id, name: folder.name }))
  const localFolders = localCollection.item.map(folder => ({ id: folder.id, name: folder.name }))

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
      .catch((error) => error)
    console.log(msg, resp)
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
