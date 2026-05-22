# Change Log

## 5.0.2 - 2026-05-22

### Bug Fixes
 - `SirenStore.submit` now rejects on error instead of silently resolving to `undefined`. Callers awaiting `store.get`/`store.submit` previously crashed with a destructure `TypeError` on any failed request.
 - `SirenStore` cache TTL — `cache-control: max-age=N` was parsed with a global regex that returned the full match instead of the digit group, leaving every cache entry with `expires: NaN`.
 - `SirenClient.parseResponse` no longer throws when the response has no `content-type` header.
 - `SirenClient.parseAction` defaults `type` to `application/x-www-form-urlencoded` when none is supplied, instead of crashing on `undefined.includes`.
 - `Shipwreck`: `error` event no longer fires twice per failure, `complete` now fires on error paths (loading bar resets correctly), and `update` no longer double-emits on each successful fetch.

## 5.0.1

 - XSS fix in raw response rendering
 - Header handling fix in `SirenClient.submit`

## 5.0.0 - 2026-04-21

### Breaking Changes
 - `SirenClient.get` now takes an options object `{ href }` instead of a positional string, matching `SirenClient.submit` and `SirenStore.get`

### Bug Fixes
 - `SirenClient.get` previously passed a bare `SirenAction` to `submit`, which expects `{ action, options, fields }` — the call now wraps the action correctly

## 4.0.1 - 2025-07-08

 - Add support for `multiline` field class to force textarea rendering for text fields.

## 4.0.0 - 2024-07-07

### Breaking Changes
 - Removed caching functionality to improve performance and reduce complexity

### Features
 - Display values for radio and checkbox inputs
 - Decode encoded URLs when entered into path
 - Be more flexible when joining base URL and path
 - PUT/DELETE fields in request body instead of URL search parameters for DELETE operations

### Security Updates
 - Updated braces from 3.0.2 to 3.0.3
 - Updated ws from 7.5.9 to 7.5.10
 - Updated ip from 1.1.8 to 1.1.9

## 3.0.3 - 2020-04-30

### Features
 - Send tokens to subdomains on same authorized domain
 - Handle undefined values in options
 - Link directly to resources when type is set
 - Better link validation

## 3.0.0 - 2020-04-16

### Breaking Changes
 - Major architecture changes for better entity handling
 - Improved form submission flow

### Features
 - Added SirenClient for better API interaction
 - Added SirenStore with caching, API-specific options, and event/entity listeners
 - Support for options property and datalist for text inputs
 - Added date, datetime, and datetime-local input rendering
 - Updated radio styling
 - Better entity store functionality with parseAction method
 - Account for action types that have a charset
 - Display properties and actions in sub-sub-entities

### Security Updates
 - Updated lodash from 4.17.15 to 4.17.19
 - Updated websocket-extensions from 0.1.3 to 0.1.4
 - Updated acorn from 6.3.0 to 7.1.1

## 2.5.0 - 2020-03-27

### Features
 - Siren entity search for links and sub-entities by href
 - Show sub-entities of sub-entities
 - Updated box demo
 - Adjusted sub-entity styles

## 2.3.0 - 2020-01-06

### Features
 - Add support for `multipart/form-data` actions and `file` inputs
 - Split various siren classes into separate files
 - Started comprehensive change log

## 2.2.0 - 2019

### Features
 - Added class list display for action cards
 - Respect the checked attribute of checkbox fields
 - Support for radio inputs with array of values
 - Confirm deletion functionality

## 1.2.0 - 2019

### Features
 - Added tabs for sub-entity properties and actions
 - Parse out query parameters for the current path
 - Better handling of relative and absolute URLs
 - Support for checkbox inputs
 - Methods other than GET/POST support

## 1.0.0 - 2019

### Initial Release
 - Basic Siren hypermedia API browsing functionality
 - Entity property, link, action, and sub-entity rendering
 - Form submission capabilities
 - Token-based authentication support
 - Tabbed interface for different views
 - Raw JSON display option
