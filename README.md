# Shipwreck

A simple generic web based UI for browsing any [Siren](https://github.com/kevinswiber/siren) Hypermedia API.

Enter an API endpoint to render all the entity's properties, links, actions, and sub-entities.

![entity](./images/shipwreck.entity.png)

You can access [Shipwreck hosted on github.io](https://stephenwright.github.io/shipwreck/).

Or download the npm package and use it as a base for building your own UI.

## Note

Shipwreck includes the following extension that are not part of the default spec.

### Array of values for "radio" field type

An html radio control works by having the same name for multiple inputs.
Siren field's `name` property MUST be unique.

Shipwreck follows [this proposal](https://groups.google.com/forum/#!msg/siren-hypermedia/8mbOX44gguU/qLzbV0LDBgAJ)
to allow an array of values.

```
{
  "title": "Example Radio Control",
  "name": "radio-control",
  "type": "radio",
  "value": [
    {
      "title": "Enable",
      "value": true,
      "checked": true
    },
    {
      "title": "Disable",
      "value": false
    }
  ]
}
```

### The "checked" field property

Shipwreck supports the field having a `checked` property for inputs of type `radio` and `checkbox`

### The "select" field type

`select` is not a valid field type in the Siren spec. Shipwreck supports `select`, and expects `value` to be an array.

```
{
  "title": "Example Select Control",
  "name": "select-control",
  "type": "select",
  "value": [
    {
      "title": "Blue",
      "value": "blue"
    },
    {
      "title": "Green",
      "value": "green",
      "selected": true
    }
  ]
}
```
