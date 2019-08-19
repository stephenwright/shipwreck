export default {
  class: ['box'],
  properties: {
    label: 'My box of stuff',
    public: true,
    meta: {
      tags: [
        'kitchen',
        'tools',
      ],
      count: 7,
    },
    created: '2018-09-23T16:32:05Z',
    updated: '2018-09-25T01:25:45Z',
  },
  title: 'A box to put items into',
  entities: [
    {
      class: ['collection', 'items'],
      rel: ['http://example.com/rel/box-items'],
      href: 'http://api.example.com/boxes/1/items',
    },
    {
      class: ['user'],
      rel: ['http://example.com/rel/box-owner'],
      properties: {
        name: 'Chester Tester',
        id: 'u123',
      },
      links: [
        { rel: ['self'], href: 'http://api.example.com/users/1' },
      ],
    },
  ],
  actions: [
    {
      name: 'add-item',
      method: 'POST',
      href: 'http://api.example.com/boxes/1',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'description', type: 'text' },
      ],
    },
    {
      name: 'update-box',
      method: 'POST',
      href: 'http://api.example.com/boxes/1',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'public', type: 'checkbox', value: true },
        {
          name: 'colour',
          type: 'select',
          value: 'green',
          options: [
            { title: 'Select a colour', value: '' },
            { value: 'blue' },
            { value: 'green' },
            { value: 'red' },
            { value: 'purple' },
          ],
        },
      ],
    },
  ],
  links: [
    { rel: ['self'], href: 'http://api.example.com/boxes/1' },
    { rel: ['next'], href: 'http://api.example.com/boxes/2' },
  ],
};
