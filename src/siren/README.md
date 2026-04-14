# Shipwreck / Siren

Classes and clients for working with [Siren](https://github.com/kevinswiber/siren) Hypermedia APIs.

```js
import { SirenClient, SirenStore, SirenEntity } from 'shipwreck/siren';
```

## SirenClient

A client for fetching and submitting siren entities.

```js
const client = new SirenClient();
const { entity } = await client.get('https://api.example.com/entity');
const action = entity.getAction('update');
action.getField('name').value = 'New Name';
const { entity, response } = await client.submit({ action });
```

## SirenStore

A higher-level client with caching, target-specific options, request deduplication, and events.

```js
const store = new SirenStore();

store.addTarget({
  href: 'https://api.example.com',
  options: {
    headers: { 'Authorization': `Bearer ${token}` },
  },
});

store.on('error', ({ detail }) => {
  console.error(detail.message, detail.response.status);
});

store.on('set:https://api.example.com/entity', ({ detail }) => {
  console.info('entity updated', detail.entity);
});

const { entity } = await store.get({ href: 'https://api.example.com/entity' });
const action = entity.getAction('update');
const { entity, response } = await store.submit({ action, fields: { name: 'new name' } });
```
