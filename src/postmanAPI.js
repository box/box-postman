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

  async update (folderId, folder) {
    return await this.axios.put(
        `https://api.getpostman.com/collections/${this.collectionId}/folders/${folderId}`,
        folder
    ).then(function (response) {
      if (response.status !== 200) {
        throw new Error(`Error updating folder ${folder.Id}: ${response.status} ${response.statusText}`)
      } else {
        return response.data
      }
    })
    // .catch(function (error) {
    //   logAxiosError(error)
    // })
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

  async update (request, requestId) {
    return await this.axios.put(
        `https://api.getpostman.com/collections/${this.collectionId}/requests/${requestId}`,
        request
    ).then(function (response) {
      if (response.status !== 200) {
        throw new Error(`Error updating request ${request.id}: ${response.status} ${response.statusText}`)
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

class Response {
  constructor (collectionId) {
    this.collectionId = collectionId
    this.apiKey = process.env.POSTMAN_API_KEY
    this.axios = axios.create({
      timeout: 10000,
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': this.apiKey }
    })
  }

  async get (responseId) {
    return await this.axios.get(
            `https://api.getpostman.com/collections/${this.collectionId}/responses/${responseId}`
    ).then(function (axiosResp) {
      if (axiosResp.status !== 200) {
        throw new Error(`Error getting response ${responseId}: ${axiosResp.status} ${axiosResp.statusText}`)
      } else {
        return axiosResp.data
      }
    })
      .catch(function (error) {
        logAxiosError(error)
      })
  }

  async create (response, requestId) {
    return await this.axios.post(
        `https://api.getpostman.com/collections/${this.collectionId}/responses`,
        response,
        { params: { request: requestId } }
    ).then(function (axiosResp) {
      if (axiosResp.status !== 200) {
        throw new Error(`Error creating response ${response.id}: ${axiosResp.status} ${axiosResp.statusText}`)
      } else {
        return axiosResp.data
      }
    })
      .catch(function (error) {
        logAxiosError(error)
      })
  }

  async delete (responseId) {
    return await this.axios.delete(
        `https://api.getpostman.com/collections/${this.collectionId}/responses/${responseId}`

    ).then(function (axiosResp) {
      if (axiosResp.status !== 200) {
        throw new Error(`Error deleting response ${responseId}: ${axiosResp.status} ${axiosResp.statusText}`)
      } else {
        return axiosResp.data
      }
    })
      .catch(function (error) {
        logAxiosError(error)
      })
  }
} // class Response

module.exports = {
  Collection,
  Folder,
  Request,
  Response
}
