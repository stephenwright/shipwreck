# Shipwreck / siren

A collection of classes to work with siren entities.

## SirenClient

A client for fetching entities with support for JSON web tokens.

```js
const client = new SirenClient();
client.jwt(token);
const { entity } = client.get({ href: 'https://api.example.com/entity' });
const action = entity.getAction('update');
actions.getField('name').value = 'New Name';
const { entity, response } = await client.submit({ action });
```

## SirenStore

A more advanced client with caching, api specific options, and event/entity listeners.

```js
const store = new SirenStore();

store.addTarget({
  href: 'https://api.example.com',
  options: {
    headers: { 'Authorization', `Bearer ${token}` },
  },
});

store.addEventListener('error', ({ message, response }) => {
  console.error(message, response.status);
});

store.addEntityListener('https://api.example.com/entity', ({ entity, response, error, status }) => {
  console.info('entity updated', entity);
});

const { entity } = store.get({ href: 'https://api.example.com/entity' });
const action = entity.getAction('update');
const { entity, response } = await store.submit({ action, fields: { name: 'new name' } });
```
