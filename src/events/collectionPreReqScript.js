/* global pm */
/* global KEYUTIL */
/* global KJUR */

/* eslint-disable camelcase */
/* eslint-disable object-shorthand */
const check_environment = () => {
  // check current environment name
  const env_type = pm.environment.get('box_env_type')

  if (!env_type) { throw new Error('Unable to identify environment type. Please select a supported environment') }

  const error_msg = []

  // check environment variables
  if (env_type === EnvType.BEARER) {
    const access_token = pm.environment.get('access_token')
    if (!access_token) { error_msg.push('Access Token') }
  } else {
    const client_id = pm.environment.get('client_id')
    const client_secret = pm.environment.get('client_secret')

    if (!client_id) { error_msg.push('Client_id') }
    if (!client_secret) { error_msg.push('Client secret') }
  }
  if (env_type === EnvType.OAUTH) {
    const refresh_token = pm.environment.get('refresh_token')
    if (!refresh_token) { error_msg.push('Refresh token') }
  }

  if (env_type === EnvType.CCG || env_type === EnvType.JWT) {
    const box_subject_type = pm.environment.get('box_subject_type')
    const box_subject_id = pm.environment.get('box_subject_id')

    if (!box_subject_type) {
      error_msg.push('Box subject type')
    } else {
      if (!(box_subject_type === 'enterprise' || box_subject_type === 'user')) {
        error_msg.push('Box subject type (enterprise or user)')
      }
    }
    if (!box_subject_id) { error_msg.push('Box subject id') }
  }

  if (env_type === EnvType.JWT) {
    const key_id = pm.environment.get('key_id')
    const private_key_encrypted = pm.environment.get('private_key_encrypted')
    const private_key_passphrase = pm.environment.get('private_key_passphrase')

    if (!key_id) { error_msg.push('Key id') }
    if (!private_key_encrypted) { error_msg.push('Private key') }
    if (!private_key_passphrase) { error_msg.push('Passphrase') }
  }

  if (error_msg.length > 0) {
    // there is an error
    throw new Error('Invalid enviroment variables: ' + error_msg.join(', '))
  }
  return env_type
}

const get_token = (urlencoded) => {
  const req = {
    url: 'https://api.box.com/oauth2/token',
    method: 'POST',
    headers: { 'Content-Type': 'Content-Type: application/x-www-form-urlencoded' },
    body: {
      mode: 'urlencoded',
      urlencoded: urlencoded
    }
  }

  console.info('Requesting a new access token')

  return new Promise((resolve, reject) => {
    pm.sendRequest(req, (err, resp) => {
      if (err) {
        console.warn('Could not get the access token')
        console.warn(err)
        throw new Error('Unable to obtain token, check the console for more details.')
      }

      const data = resp.json()
      if (data.error) {
        console.warn('Could not get the access token')
        console.warn(data)
        throw new Error('Unable to obtain token, check the console for more details.')
      }

      return resolve(data)
    })
  })
}

async function refresh_ccg () {
  const urlencoded = [
    { key: 'client_id', value: pm.environment.get('client_id'), disabled: false },
    { key: 'client_secret', value: pm.environment.get('client_secret'), disabled: false },
    { key: 'box_subject_type', value: pm.environment.get('box_subject_type'), disabled: false },
    { key: 'box_subject_id', value: pm.environment.get('box_subject_id'), disabled: false },
    { key: 'grant_type', value: 'client_credentials', disabled: false }
  ]

  return await get_token(urlencoded).then((data) => {
    const expires_at = Date.now() + (data.expires_in - 30) * 1000
    pm.environment.set('access_token', data.access_token)
    pm.environment.set('expires_at', expires_at)
  })
}

async function refresh_oauth () {
  const urlencoded = [
    { key: 'client_id', value: pm.environment.get('client_id'), disabled: false },
    { key: 'client_secret', value: pm.environment.get('client_secret'), disabled: false },
    { key: 'refresh_token', value: pm.environment.get('refresh_token'), disabled: false },
    { key: 'grant_type', value: 'refresh_token', disabled: false }
  ]

  return await get_token(urlencoded).then((data) => {
    const expires_at = Date.now() + (data.expires_in - 30) * 1000
    pm.environment.set('access_token', data.access_token)
    pm.environment.set('expires_at', expires_at)

    const refresh_token_expires_at = Date.now() + (59 * 24 * 60 * 60 * 1000)
    pm.environment.set('refresh_token', data.refresh_token)
    pm.environment.set('refresh_token_expires_at', refresh_token_expires_at)
  })
}

function get_jwt_assertion () {
  // libJSRSASign lib
  const libJSRSASign = pm.collectionVariables.get('libJSRSASign')
  /* eslint-disable no-global-assign */
  navigator = {}
  window = {}
  /* eslint-disable no-eval */
  eval(libJSRSASign)

  // UUID
  const uuid = require('uuid')

  const private_key_encrypted = pm.environment.get('private_key_encrypted')
  const private_key_passphrase = pm.environment.get('private_key_passphrase')

  const private_key = KEYUTIL.getKey(private_key_encrypted, private_key_passphrase)

  const kid = pm.environment.get('key_id')
  const iss = pm.environment.get('client_id')
  const sub = pm.environment.get('box_subject_id')
  const box_sub_type = pm.environment.get('box_subject_type')
  const aud = 'https://' + pm.collectionVariables.get('api.box.com') + '/oauth2/token'
  const jti = uuid.v4()
  // const exp = KJUR.jws.IntDate.get("now + 1minute")
  const exp = Math.floor(Date.now() / 1000) + 45
  const iat = KJUR.jws.IntDate.get('now')

  const header = { alg: 'RS512', typ: 'JWT', kid: kid }

  const claims =
    {
      iss: iss,
      sub: sub,
      box_sub_type: box_sub_type,
      aud: aud,
      jti: jti,
      exp: exp,
      iat: iat
    }

  const jwt = KJUR.jws.JWS.sign(null, header, claims, private_key)

  //   console.log(`header: ${JSON.stringify(header)}`)
  //   console.log(`claim set: ${JSON.stringify(claims)}`)
  //   console.log('JWT Assertion: ', jwt)

  return jwt
}

async function refresh_jwt (assertion) {
  const urlencoded = [
    { key: 'client_id', value: pm.environment.get('client_id'), disabled: false },
    { key: 'client_secret', value: pm.environment.get('client_secret'), disabled: false },
    { key: 'box_subject_type', value: pm.environment.get('box_subject_type'), disabled: false },
    { key: 'box_subject_id', value: pm.environment.get('box_subject_id'), disabled: false },
    { key: 'grant_type', value: 'urn:ietf:params:oauth:grant-type:jwt-bearer', disabled: false },
    { key: 'assertion', value: assertion, disabled: false }
  ]

  return await get_token(urlencoded).then((data) => {
    const expires_at = Date.now() + (data.expires_in - 30) * 1000
    pm.environment.set('access_token', data.access_token)
    pm.environment.set('expires_at', expires_at)
  })
}

const box_postman = () => {
  // if authotization type is not null (not inherited) then exit the script
  if (pm.request.auth) { return }

  //   console.info('Collection variables',pm.collectionVariables.toObject())

  const env_type = check_environment()

  // determine if the Access Token has expired
  const expiresAt = pm.environment.get('expires_at') || 0
  const is_expired = Date.now() > Number(expiresAt)

  // refresh the access token if needed
  if (is_expired) {
    switch (env_type) {
      case EnvType.BEARER:
        console.info('can`t refresh bearer token, sending as is...')
        break
      case EnvType.OAUTH:
        /* eslint-disable no-case-declarations */
        const current_refresh_expiration = pm.environment.get('refresh_token_expires_at') || 0
        const is_expired = Date.now() > Number(current_refresh_expiration)
        if (is_expired) { throw new Error('Refresh token has expired') }
        refresh_oauth()
        break
      case EnvType.CCG:
        refresh_ccg()
        break
      case EnvType.JWT:
        const assertion = get_jwt_assertion()
        refresh_jwt(assertion)
        break
      default:
        throw new Error('Unrecognized environment. Please select one of the supported Box environments')
    }
  }
}

// Defined environment types
const EnvType = {
  BEARER: 'BEARER',
  OAUTH: 'OAUTH',
  CCG: 'CCG',
  JWT: 'JWT'
}

box_postman()
