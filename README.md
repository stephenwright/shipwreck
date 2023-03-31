# Shipwreck

A simple generic web based UI for browsing any [Siren](https://github.com/kevinswiber/siren) Hypermedia API.

Enter an API endpoint to render all the entity's properties, links, actions, and sub-entities.

![entity](./images/shipwreck.entity.png)

You can access [Shipwreck hosted on github.io](https://stephenwright.github.io/shipwreck/).

Or download the npm package and use it as a base for building your own UI.

## Note

Shipwreck includes the following extension that are not part of the default spec.

### The "checked" field property

Shipwreck supports the field having a `checked` property for inputs of type `radio` and `checkbox`

```
{
  "title": "Sign Me Up For The Newsletter",
  "name": "newsletter",
  "type": "checkbox",
  "value": "yes",
  "checked": true,
}
```

### The "select" field type

`select` is not a valid field type in the Siren spec, but is supported by Shipwreck.
You can specify options using `options` property, or by having options array assigned to `value`.

### Options

Options for a datalist, or select can be provided via an options property.

```
{
  "title": "Example Text Control with Data List",
  "name": "autocomplete-text-control",
  "type": "text",
  "value": "",
  "options": [
    { "value": "Blue" },
    { "value": "Green" }
  ]
}
```

Options can also be used for radio, and checkbox.

```
{
  "title": "Example Radio",
  "name": "radio-control",
  "type": "radio",
  "value": "",
  "options": [
    { "title": "Blue", "value": "blue", "checked": true },
    { "title": "Green", "value": "green" }
  ]
}
```

Shipwreck also supports options being assigned to `value`
as per [this proposal](https://groups.google.com/forum/#!msg/siren-hypermedia/8mbOX44gguU/qLzbV0LDBgAJ).

*Be aware, if using this option, you need to replace `value` with the value of the selected option before submitting the action.*

```
{
  "title": "Example Select Control",
  "name": "select-control",
  "type": "select",
  "value": [
    { "title": "Blue", "value": "blue" },
    { "title": "Green", "value": "green", "selected": true }
  ]
}
```
