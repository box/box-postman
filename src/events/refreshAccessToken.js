/**
 * A script that is run before every API request. It is used to notify users
 * that their access token has expired, and optionally can be used to
 * automatically try and refresh access tokens.
 * 
 * Usage:
 * 
 * Set the `enable_auto_refresh_access_token` variable in your environment to
 * "true" to enable automatic refreshing of your access token.
 */

// determine if the Access Token has expired
let expiresAt = pm.environment.get('expires_at')
let expired = Date.now() > Number(expiresAt)

// determine if the user has auto-refresh enabled
let autoRefresh = String(pm.environment.get('enable_auto_refresh_access_token')) === 'true'

// determine if we have all the client credentials needed in the environment
let hasClientId = String(pm.environment.get('client_id')).length === 32
let hasClientSecret = String(pm.environment.get('client_secret')).length === 32
let hasRefreshToken = String(pm.environment.get('refresh_token')).length === 64
let hasAllCredentials = hasClientId && hasClientSecret && hasRefreshToken

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
        { key: 'grant_type', value: 'refresh_token', disabled: false },
      ]
    }
  }, function (error, response) {
    if (error) { 
      // if an error occured, log the error and raise a message to the user.
      console.log('Could not refresh the access token')
      console.log(error)
      console.log(response.json())
      throw new Error('Could not refresh the access token. Check the console for more details.')
    } else {
      // otherwise, fetch the new access token and store it
      let data = response.json()

      // determine when this token is set to expire at
      let newExpiresAt = Date.now() + data.expires_in
      // store the new variables in the environment
      pm.environment.set('access_token', data.access_token);
      pm.environment.set('refresh_token', data.refresh_token);
      pm.environment.set('expires_at', newExpiresAt);
    }
  })
}

// otherwise, throw a message to the user if the access token expired.
else if (expired) {
  throw new Error('Access token expired. Please use the "Refresh access token" API to request a new token.')
}

