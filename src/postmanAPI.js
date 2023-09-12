require('dotenv').config()
const axios = require('axios')
const { logAxiosError } = require('./Utils')

class Collection {
  constructor (collectionId) {
    this.collectionId = collectionId
    this.apiKey = process.env.POSTMAN_API_KEY
    this.axios = axios.create({
      timeout: 10000,
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': this.apiKey }
    })
  }

  async get () {
    return await this.axios.get(
            `https://api.getpostman.com/collections/${this.collectionId}`
    ).then(function (response) {
      if (response.status !== 200) {
        throw new Error(`Error getting collection ${this.collectionId}: ${response.status} ${response.statusText}`)
      } else {
        return response.data
      }
    })
      .catch(function (error) {
        logAxiosError(error)
      })
  }
}

class Folder {
  constructor (collectionId) {
    this.collectionId = collectionId
    this.apiKey = process.env.POSTMAN_API_KEY
    this.axios = axios.create({
      timeout: 10000,
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': this.apiKey }
    })
  }

  async get (folderId) {
    return await this.axios.get(
            `https://api.getpostman.com/collections/${this.collectionId}/folders/${folderId}`
    ).then(function (response) {
      if (response.status !== 200) {
        throw new Error(`Error getting folder ${folderId}: ${response.status} ${response.statusText}`)
      } else {
        return response.data
      }
    })
      .catch(function (error) {
        logAxiosError(error)
      })
  }

  async create (folder) {
    return await this.axios.post(
        `https://api.getpostman.com/collections/${this.collectionId}/folders`,
        folder
    ).then(function (response) {
      if (response.status !== 200) {
        throw new Error(`Error creating folder ${folder.Id}: ${response.status} ${response.statusText}`)
      } else {
        return response.data
      }
    })
      .catch(function (error) {
        logAxiosError(error)
      })
  }

  async delete (folderId) {
    return await this.axios.delete(
        `https://api.getpostman.com/collections/${this.collectionId}/folders/${folderId}`

    ).then(function (response) {
      if (response.status !== 200) {
        throw new Error(`Error deleting folder ${folderId}: ${response.status} ${response.statusText}`)
      } else {
        return response.data
      }
    })
      .catch(function (error) {
        logAxiosError(error)
      })
  }
} // class Folder

class Request {
  constructor (collectionId) {
    this.collectionId = collectionId
    this.apiKey = process.env.POSTMAN_API_KEY
    this.axios = axios.create({
      timeout: 10000,
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': this.apiKey }
    })
  }

  async get (requestId) {
    return await this.axios.get(
            `https://api.getpostman.com/collections/${this.collectionId}/requests/${requestId}`
    ).then(function (response) {
      if (response.status !== 200) {
        throw new Error(`Error getting request ${requestId}: ${response.status} ${response.statusText}`)
      } else {
        return response.data
      }
    })
      .catch(function (error) {
        logAxiosError(error)
      })
  }

  async create (request, folderId) {
    return await this.axios.post(
        `https://api.getpostman.com/collections/${this.collectionId}/requests`,
        request,
        { params: { folder: folderId } }
    ).then(function (response) {
      if (response.status !== 200) {
        throw new Error(`Error creating request ${request.id}: ${response.status} ${response.statusText}`)
      } else {
        return response.data
      }
    })
      .catch(function (error) {
        logAxiosError(error)
      })
  }

  async delete (requestId) {
    return await this.axios.delete(
        `https://api.getpostman.com/collections/${this.collectionId}/requests/${requestId}`

    ).then(function (response) {
      if (response.status !== 200) {
        throw new Error(`Error deleting request ${requestId}: ${response.status} ${response.statusText}`)
      } else {
        return response.data
      }
    })
      .catch(function (error) {
        logAxiosError(error)
      })
  }
} // class Request

module.exports = {
  Collection,
  Folder,
  Request
}
