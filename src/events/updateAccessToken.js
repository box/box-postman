/**
 * Test script to run after every API request.
 * 
 * Used to automatically pick up on a refreshed access token and store the new values.
 */

// only store a new value if the request was made to the right endpoint
const isRightAPI = pm.request.url.path.join('/') === 'oauth2/token'
if (!isRightAPI) { return }

// only store the new value of there actually was a request body
const hasBody = !!pm.request.body 
if (!hasBody) { return }

// only store the new value if the body was urlencoded
const isUrlEncoded = pm.request.body.mode === 'urlencoded'
if (!isUrlEncoded) { return }

// only store the new value if the body had a grant type
const grantType = pm.request.body.urlencoded.filter(param => param.key === 'grant_type')[0]
const hasGrantType = !!grantType
if (!hasGrantType) { return }

// only store the new value if the grant type was "refresh_token"
const isRefreshTokenRequest = grantType.value === 'refresh_token'
if (!isRefreshTokenRequest) { return }

// only store the new value if the response has an access token
const response = pm.response.json()
const hasAccessToken = !!response.access_token
if (!hasAccessToken) { return }

// determine when this token is set to expire at
let newExpiresAt = Date.now() + response.expires_in*1000
// store the new values
pm.environment.set('access_token', response.access_token);
pm.environment.set('refresh_token', response.refresh_token);
pm.environment.set('expires_at', newExpiresAt);