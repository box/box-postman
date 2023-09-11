const uuid = require('uuid')
const NAMESPACE = '33c4e6fc-44cb-4190-b19f-4a02821bc8c3'

const genID = (objectJSON = null) => {
  if (!objectJSON) {
    return uuid.v5(JSON.stringify(objectJSON), NAMESPACE)
  } else {
    return uuid.v4()
  }
}

// Sort 2 objects by name
const byName = (a, b) => {
  if (a.name < b.name) {
    return -1
  } else if (a.name > b.name) {
    return 1
  }
  return 0
}

// Sort two object by priority
const byPriority = (a, b) => {
  if (a['x-box-priority']) {
    return -1
  } else if (b['x-box-priority']) {
    return 1
  }
  return 0
}

// log axios error
const logAxiosError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log('ERROR DATA', error.response.data)
    // console.log('ERROR STATUS', error.response.status)
    // console.log('ERROR HEADERS', error.response.headers)
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
  // process.exit(1)
}

module.exports = {
  GenID: genID,
  ByName: byName,
  ByPriority: byPriority,
  logAxiosError
}
