/* global pm */

/**
 * Pre-request script ran before every API request.
 *
 * Used to notify users that their access token has expired
 */

// determine if the Access Token has expired
const expiresAt = pm.environment.get('expires_at')
const expired = Date.now() > Number(expiresAt)

// determine if the user has auto-refresh enabled
const autoRefresh = String(pm.environment.get('enable_auto_refresh_access_token')) === 'true'

// determine if we have all the client credentials needed in the environment
const hasClientId = String(pm.environment.get('client_id')).length === 32
const hasClientSecret = String(pm.environment.get('client_secret')).length === 32
const hasRefreshToken = String(pm.environment.get('refresh_token')).length === 64
const hasAllCredentials = hasClientId && hasClientSecret && hasRefreshToken

// if the access token expired and auto refresh has been set, use the refresh
// token to create a new access token
if (expired && autoRefresh && hasAllCredentials) {
  // send a new API request to refresh the access token
  pm.sendRequest({
    url: 'https://api.box.com/oauth2/token',
    method: 'POST',
    headers: { 'Content-Type': 'Content-Type: application/x-www-form-urlencoded' },
    body: {
      mode: 'urlencoded',
      urlencoded: [
        { key: 'client_id', value: pm.environment.get('client_id'), disabled: false },
        { key: 'client_secret', value: pm.environment.get('client_secret'), disabled: false },
        { key: 'refresh_token', value: pm.environment.get('refresh_token'), disabled: false },
        { key: 'grant_type', value: 'refresh_token', disabled: false }
      ]
    }
  }, function (error, response) {
    if (error || response.json().error) {
      // if an error occured, log the error and raise a message to the user.
      console.log('Could not refresh the access token')
      console.log(error)
      console.log(response.json())
      throw new Error('Could not refresh the access token. Check the console for more details.')
    } else {
      // otherwise, fetch the new access token and store it
      const data = response.json()

      // determine when this token is set to expire at
      const newExpiresAt = Date.now() + data.expires_in * 1000
      // store the new variables in the environment
      pm.environment.set('access_token', data.access_token)
      pm.environment.set('refresh_token', data.refresh_token)
      pm.environment.set('expires_at', newExpiresAt)
    }
  })
} else if (expired) {
  // otherwise, throw a message to the user if the access token expired.
  throw new Error('Access token expired. Please use the "Refresh access token" API to request a new token.')
}
