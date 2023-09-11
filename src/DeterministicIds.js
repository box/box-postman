const uuid = require('uuid')
const NAMESPACE = '33c4e6fc-44cb-4190-b19f-4a02821bc8c3'

const genIDDeterm = (objectJSON) => {
  const id = uuid.v5(JSON.stringify(objectJSON), NAMESPACE)
  return id
}

const genIDRandom = () => {
  const id = uuid.v4()
  return id
}

module.exports = {
  genIDDeterm: genIDDeterm,
  genIDRandom: genIDRandom
}
