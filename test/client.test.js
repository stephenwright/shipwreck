import { SirenAction } from '../src/siren/siren-action.js';
import { SirenClient } from '../src/siren/siren-client.js';

const action = new SirenAction({
  name: 'test',
  href: 'http://api.example.com/test',
  method: 'GET',
  fields: [
    {
      title: 'Parts: Arms',
      name: 'props[parts][arms]',
      type: 'number',
      value: 2, // will remain unchanged
    },
    {
      title: 'Parts: Legs',
      name: 'props[parts][legs]',
      type: 'number',
      value: 4, // will be replaced
    },
  ],
});

const data = {
  props: {
    count: 11,
    parts: {
      legs: 7, // updates existing field
      size: 4,
    },
  },
  levels: [1,2,3],
  foo: 'bar',
  weee: [
    'wham',
    { whoa: 1 },
    { wow: [4,5,6] },
    [7,8,9],
  ],
};

const client = new SirenClient();

const dataFields = client.objectToFields(data);
console.log('data > fields:', dataFields.map(f => f.json));

const combinedFields = client.combineFields(action.fields, dataFields);
console.log('combined:', combinedFields.map(f => f.json));
