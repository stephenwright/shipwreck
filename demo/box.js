export default {
  class: ['box'],
  properties: {
    label: 'My box of stuff',
    description: 'This is a box of stuff.\nIt contains a lot of things.\nSome of which are useful.\nSome of which are not.',
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
        { rel: ['http://example.com/rel/box-owner-website'], href: 'http://example.com', type: 'text/html', title: 'Box owner\'s website' },
      ],
    },
  ],
  actions: [
    {
      name: 'add-item',
      title: 'Add an Item',
      method: 'POST',
      href: 'http://api.example.com/boxes/1',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'description', type: 'text', class: ['multiline'] },
      ],
    },
    {
      name: 'update-box',
      title: 'Update Box',
      method: 'POST',
      href: 'http://api.example.com/boxes/1',
      fields: [
        { name: 'label', title: 'Label', type: 'text', required: true },
        { name: 'public', title: 'Public', type: 'checkbox', checked: true },
        {
          name: 'description',
          title: 'Description',
          type: 'text',
          class: ['multiline'],
          value: 'This is a box of stuff.\nIt contains a lot of things.\nSome of which are useful.\nSome of which are not.',
        },
        {
          name: 'material',
          title: 'Material',
          type: 'text',
          value: '',
          options: [
            { value: 'cardboard' },
            { value: 'wood' },
            { value: 'metal' },
          ],
        },
        {
          name: 'level',
          title: 'Level',
          type: 'radio',
          value: [
            { title: 'Full', value: 'full' },
            { title: 'Half Full', value: 'half' },
            { title: 'Half Empty', value: 'half' },
            { title: 'Empty', value: 'empty', checked: true },
          ],
        },
        {
          name: 'colour',
          title: 'Colour',
          type: 'select',
          value: 'red',
          options: [
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
