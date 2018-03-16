# Overview

### In this package:

- [Hull Client](#hull)
    > Most low level Hull Platform API client: `const hull = new Hull({ configuration })`

### In the Hull-node package (which embeds this one):

- [Hull Middleware](https://github.com/hull/hull-node)
    > A bridge between Hull Client and a NodeJS HTTP application (e.g. express) which initializes context for every HTTP request:
    > `app.use(Hull.Middleware({ configuration }))`
- [Hull Connector](https://github.com/hull/hull-node)
    > A complete toolkit to operate with Hull Client in request handlers. Includes Hull Middleware and a set of official patterns to build highly scalable and efficient Connectors:
    > `const connector = new Hull.Connector({ configuration })`

![hull node core components](docs/assets/hull-node-components.png)

---

# HullClient

This library makes it easy to interact with the Hull API, store events and properties on users and accounts.

Creating a new Hull client is pretty straightforward:

`npm install -s hull-client`

```js
const HullClient = require("hull-client");

const hullClient = new HullClient({
  id: "HULL_ID",
  secret: "HULL_SECRET",
  organization: "HULL_ORGANIZATION_DOMAIN"
});
```

Find all required and optional constructor options in [API REFERENCE](./API.md#hullclient).

## Calling the API

Once you have instantiated a `HullClient`, you can use one of the `get`, `post`,
`put`or `del` methods to perform actions of our [HTTP API](https://www.hull.io/docs/references/api/).

```js
// `client.api.get` works too.
const params = {};
hullClient.get(path, params)
  .then(function(response) {
    console.log(response);
  })
  .catch(function(err) {
    console.log(err);
  });
```

The first parameter is the route, the second is the set of parameters you want
to send with the request. They all return Promises so you can use the `.then()` syntax.

Find detailed description of those api methods in [API REFERENCE](./API.md#api).

## Impersonating an User

One of the more frequent use case is to store attributes and events with the identity of a given user. We provide several methods to do so.

```js
// if you have a user id from your database, use the `external_id` field
const user = hullClient.asUser({ external_id: "dkjf565wd654e" });

// if you have a Hull Internal User Id:
const user = hullClient.asUser({ id: "5718b59b7a85ebf20e000169" });
// or just as a string:
const user = hullClient.asUser("5718b59b7a85ebf20e000169");

// you can optionally pass additional user resolution options as a second argument:
const user = hullClient.asUser({ id: "5718b59b7a85ebf20e000169" }, { create: false });

// Constant `user` is an instance of Hull, scoped to a specific user.
user.get("/me").then(function(me) {
  console.log(me);
});
user.userToken();
```

You can use an internal Hull `id`, an ID from your database that we call `external_id`, an `email` address or `anonymous_id`.

Using `asUser` method doesn't make an API call, it just returnes scoped instance of `HullClient` which comes with additional methods (see [API REFERENCE](./API.md#scopedhullclient)).

The second parameter lets you define additional options (JWT claims) passed to the user resolution script which customize how platform identity resolution mechanism will work (see [API REFERENCE](./API.md#asuser)).

### Examples

> Return a `HullClient` scoped to the user identified by it's Hull ID. Not lazily created. Needs an existing User

```js
hullClient.asUser(userId, { create: false });
```

> Return a `HullClient` scoped to the user identified by it's Social network ID. Lazily created if [Guest Users](http://www.hull.io/docs/users/guest_users) are enabled

```js
hullClient.asUser("instagram|facebook|google:userId");
```

> Return a `HullClient` scoped to the user identified by it's External ID (from your dashboard). Lazily created if not present before

```js
hullClient.asUser({ external_id: "externalId" });
```

> Return a `HullClient` scoped to the user identified by it's External ID (from your dashboard). Lazily created if [Guest Users](http://www.hull.io/docs/users/guest_users) are enabled

```js
hullClient.asUser({ anonymous_id: "anonymousId" });
```

> Return a `HullClient` scoped to the user identified by only by an anonymousId. Lets you start tracking and storing properties from a user before you have a UserID ready for him. Lazily created if [Guest Users](http://www.hull.io/docs/users/guest_users) are enabled
> When you have a UserId, just pass both to link them.

```js
hullClient.asUser({ email: "user@email.com" });
```

> Return a hull `HullClient` authenticated as the user but with admin privileges

```js
hullClient.asUser({ email: "user@email.com" }, { scopes: ["admin"] });
```

Find detailed description of those claims scoping methods in [API REFERENCE](./API.md#asuser).

## Methods for user-scoped instance

```js
const externalId = "dkjf565wd654e";
const anonymousId = "44564-EJVWE-1CE56SE-SDVE879VW8D4";

const user = client.asUser({ external_id: externalId, anonymous_id: anonymousId });
```

When you do this, you get a new client that has a different behaviour. It's now behaving as a User would. It means it does API calls as a user and has new methods to track and store properties

### Storing User Events

Stores a new event.

```js
hullClient.asUser({ email: "foo@hull.io" }).track("new support ticket", {
  messages: 3,
  priority: "high"
}, {
  source: "zendesk",
  type: 'ticket',
  event_id: 'uuid1234' // Pass a unique ID to ensure event de-duplication
  ip: null, // don't store ip - it's a server call
  referer: null, // don't store referer - it's a server call
  created_at: '2013-02-08 09:30:26.123+07:00' // ISO 8601. moment.js does it very well
});
```

Find detailed information about `track` method in [API REFERENCE](./API.md#track).

### Updating User or Account Attributes

Stores Attributes on the user:

```js
user.traits({
  opened_tickets: 12
}, { source: "zendesk" });
// 'source' is optional. Will store the traits grouped under the source name.

// Alternatively, you can send properties for multiple groups with the flat syntax:
user.traits({ "zendesk/opened_tickets": 12, "clearbit/name": "foo" });
```

By default the `traits` calls are grouped in background and send to the Hull API in batches, that will cause some small delay. If you need to be sure the properties are set immediately on the user, you can use the context param `{ sync: true }`.

```js
user.traits({
  fetched_at: new Date().toISOString()
}, {
  source: "mailchimp",
  sync: true
});
```

Find detailed information about `traits` method in [API REFERENCE](./API.md#traits).

## Utils

`HullClient` comes with a set of utilities to simplify working with Hull REST API:

- `util.settings.update` - allows to update only part of connector settings, [see details](./API.md#utilsettingsupdate)
- `util.properties.get` - parse list of attributes stored on organization level, [see details](./API.md#utilpropertiesget)
- `util.traits.group` - allows to transform flat list of attributes to nested object, [see details](./API.md#utiltraitsgroup)

## Logging

The Logger comes in two flavors, `HullClient.logger.xxx` and `hullClient.logger.xxx` - The first one is a generic logger, the second use the current instance of `HullClient` logs will contain shp id and organization for more context.

Internal logger uses [Winston](https://github.com/winstonjs/winston). By default it comes with console stdout/stderr transport which will show logs from `info` level.

```js
HullClient.logger.info("message", { object }); // Class logging method,
hullClient.logger.info("message", { object }); // Instance logging method, adds Ship ID and Organization to Context. Use if available.

// Debug works the same way but by default they won't be logged, adjust the log level in following way:
Hull.logger.transports.console.level = "debug";

HullClient.logger.debug("message", { object }); // Class logging method,
hullClient.logger.debug("message", { object });

// You can add more logging destinations like this:
const winstonSlacker = require("winston-slacker");
HullClient.logger.add(winstonSlacker,  { ... });
```

### Logs scoped to specific User or Account

You can also have a user or account scoped logger. Claims used in `asUser` and `asAccount` methods will be added to the log context.

```js
const user = hullClient.asUser({ email: "john@coltrane.com" });
user.logger.info("hello");

// it will produce following log line:
{"context":{"organization":"...","id":"...","user_email":"john@coltrane.com"},"level":"info","message":"hello"}
```

### Setting a requestId in the logs context

You can decorate all your logs context with a `request_id` which allows you to group all logs related to a particular request or transaction. 

This identifier can be passed a `requestId` param at the initialization of the Client. 

```js
const client = new Hull({ 
  organization: "193a8881.hull.io",
  id: "59e99ec13cd60e5c9d000037",
  secret: "change-me-please",
  requestId: "123"
});

client.logger.info("hello");
```

will log the following line

```js
{"context":{"organization":"193a8881.hullapp.io","id":"59e99ec13cd60e5c9d000037","request_id":"123"},"level":"info","message":"hello"}
```
