class Example {
  constructor (schema, openapi) {
    this.openapi = openapi
    this.sample = this.value(schema)
  }

  stringify () {
    return JSON.stringify(this.sample, null, 2)
  }

  // private

  generate (props) {
    const output = {}
    Object.entries(props).forEach(([key, prop]) => {
      output[key] = this.value(prop)
    })
    return output
  }

  value (prop) {
    if (prop.example) {
      return prop.example
    } else if (prop.properties && prop.type !== 'string') {
      return this.generate(prop.properties)
    } else if (prop.type === 'array' && prop.items['x-box-resource-id']) {
      return [this.generate(prop.items.properties)]
    }
  }
}

module.exports = Example
