class Example {
  constructor (body, openapi) {
    this.openapi = openapi
    this.sample = this.generate(body.properties, body.required)
  }

  stringify () {
    return JSON.stringify(this.sample, null, 2)
  }

  // private

  generate (props = {}, required = []) {
    const output = {}
    Object.entries(props).forEach(([key, prop]) => {
      // if (required.includes(key)) {
      output[key] = this.value(prop)
      // }
    })
    return output
  }

  value (prop) {
    if (prop.example) {
      return prop.example
    } else if (prop.type === 'object') {
      return this.generate(prop.properties, prop.required)
    } else if (prop.type === 'array' && prop.items['$ref']) {
      const name = prop.items['$ref'].split('schemas/')[1]
      const item = this.openapi.components.schemas[name]
      return [this.generate(item.properties, item.required)]
    }
  }
}

module.exports = Example
