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

# Hull

This library makes it easy to interact with the Hull API, send tracking and properties and handle Server-side Events we send to installed Ships.

Creating a new Hull client is pretty straightforward:

`npm install -s hull-client`

```js
import Hull from "hull-client";

const client = new Hull({
  id: "HULL_ID",
  secret: "HULL_SECRET",
  organization: "HULL_ORGANIZATION_DOMAIN"
});
```

## Calling the API

Once you have instantiated a client, you can use one of the `get`, `post`,
`put`or `delete` methods to perform actions of our APIs.

```js
// client.api.get works too.
const params = {};
client.get(path, params).then(function(data) {
  console.log(response);
}, function(err, response) {
  console.log(err);
});
```

The first parameter is the route, the second is the set of parameters you want
to send with the request. They all return Promises so you can use the `.then()` syntax if you're more inclined.

### options

Every API client method `get`, `post`, `put` and `delete` accepts two options `timeout` and `retry`:

```js
client.get(path, {}, {
  timeout: 10000,
  retry: 5000
});
```

* **timeout** - option controls if the client should retry the request if the client timeout error happens or if there is an error 503 returned serverside - the value of the option is applied for client side error
* **retry** - controls the time between timeout or 503 error occurence and the next retry being done

## Instance Methods

### client.configuration()

Returns the global configuration object.

```js
client.configuration();
// returns:
{ prefix: "/api/v1",
  domain: "hullapp.io",
  protocol: "https",
  id: "58765f7de3aa14001999",
  secret: "12347asc855041674dc961af50fc1",
  organization: "fa4321.hullapp.io",
  version: "0.11.4" }
```


### client.token()

```js
client.asUser({ email: "xxx@example.com", external_id: "1234", name: "FooBar" }).token(optionalClaims);
client.asAccount({ domain: "example.com", external_id: "1234", name: "FooBar" }).token(optionalClaims);
```

Used for [Bring your own users](http://hull.io/docs/users/byou).
Creates a signed string for the user passed in hash. `userHash` needs an `email` field.
[You can then pass this client-side to Hull.js](http://www.hull.io/docs/users/byou) to authenticate users client-side and cross-domain

### client.currentUserId()

```js
client.currentUserId(userId, userSig)
```

Checks the validity of the signature relatively to a user id

## Impersonating a User - client.asUser()

One of the more frequent use case is to perform API calls with the identity of a given user. We provide several methods to do so.

```js
// if you have a user id from your database, use the `external_id` field
const user = client.asUser({ external_id: "dkjf565wd654e" });

// if you have a Hull Internal User Id:
const user = client.asUser({ id: "5718b59b7a85ebf20e000169" });
// or just as a string:
const user = client.asUser("5718b59b7a85ebf20e000169");

// you can optionally pass additional user resolution options as a second argument:
const user = client.asUser({ id: "5718b59b7a85ebf20e000169" }, { create: false });

// Constant `user` is an instance of Hull, scoped to a specific user.
user.get("/me").then(function(me) {
  console.log(me);
});
user.userToken();
```

You can use an internal Hull `id`, an ID from your database that we call `external_id`, an `email` address or `anonymous_id`.

Assigning the `user` variable doesn't make an API call, it 
the calls to another instance of `hull` client. This means `user` is an instance of the `hull` client scoped to this user.

The second parameter lets you define additional options (JWT claims) passed to the user resolution script:

|  field  |type     | description                                                                                                           | default|
| ------- |---------| --------------------------------------------------------------------------------------------------------------------- | -------|
|  create |`boolean`| Marks if the user should be lazily created if not found                                                               | `true` |
|  scopes |`Array`  | Adds scopes claim to the JWT to impersonate a User with admin rights                                                  | `[]`   |
|  active |`string` | Marks the user as *active* meaning a reduced latency at the expense of scalability. Don't use for high volume updates | `false`|

### Possible usage

> Return a hull `client` scoped to the user identified by it's Hull ID. Not lazily created. Needs an existing User

```js
client.asUser(userId);
```

> Return a hull `client` scoped to the user identified by it's Social network ID. Lazily created if [Guest Users](http://www.hull.io/docs/users/guest_users) are enabled

```js
client.asUser("instagram|facebook|google:userId");
```

> Return a hull `client` scoped to the user identified by it's External ID (from your dashboard). Lazily created if [Guest Users](http://www.hull.io/docs/users/guest_users) are enabled

```js
client.asUser({ external_id: "externalId" });
```

> Return a hull `client` scoped to the user identified only by an anonymousId. Lets you start tracking and storing properties from a user before you have a UserID ready for him. Lazily created if [Guest Users](http://www.hull.io/docs/users/guest_users) are enabled
> When you have a UserId, just pass both to link them.

```js
client.asUser({ anonymous_id: "anonymousId" });
// or to link anonymousId with userId
client.asUser({ anonymous_id: "anonymousId", id: "userId" });
```

> Return a hull `client` scoped to the user identified only by an email. If not found would be created.

```js
client.asUser({ email: "user@email.com" });
```

> Return a hull `client` scoped to the user identified only by an email, but won't be created when not found, only updates existing user.

```js
client.asUser({ email: "user@email.com" }, { create: false });
```

> Return a hull `client` scoped to the user identified only by an email and adds `active` flag to fast track recompute and notifications for that specific user while he remains active. .

```js
client.asUser({ email: "user@email.com" }, { active: true });
```

> Return a hull `client` authenticated as the user but with admin privileges

```js
client.asUser({ email: "user@email.com" }, { scopes: ["admin"] });
```

> Return a hull `client` identified by an email and additional aliases - which are passed as an array of unique identifiers

```js
client.asUser({ email: "user@email.com", aliases: ["namespace:123"] });
```

> Return a hull `client` identified by an email and additional service_ids - which are passed as an object of unique identifiers

```js
client.asUser({ email: "user@email.com", service_ids: { serviceName: "serviceId123" } });
```

## Methods for user-scoped instance

```js
const externalId = "dkjf565wd654e";
const anonymousId = "44564-EJVWE-1CE56SE-SDVE879VW8D4";

const user = client.asUser({ external_id: externalId, anonymous_id: anonymousId });
```

When you do this, you get a new client that has a different behaviour. It's now behaving as a User would. It means it does API calls as a user and has new methods to track and store properties

### user.track(event, props, context)

Stores a new event.

```js
user.track("new support ticket", {
  messages: 3,
  priority: "high"
}, {
  source: "zendesk",
  type: "ticket",
  event_id: "uuid1234", // Pass a unique ID to ensure event de-duplication
  ip: null, // don't store ip - it's a server call
  referer: null, // don't store referer - it's a server call
  created_at: "2013-02-08 09:30:26.123+07:00" // ISO 8601. moment.js does it very well
});
```

The `context` object lets you define event meta-data. Everything is optional

- **source**: Defines a namespace, such as `zendesk`, `mailchimp`, `stripe`
- **type**: Define a event type, such as `mail`, `ticket`, `payment`
- **created_at**: Define an event date. defaults to `now()`
- **event_id**: Define a way to de-duplicate events. If you pass events with the same unique `event_id`, they will overwrite the previous one.
- **ip**: Define the Event's IP. Set to `null` if you're storing a server call, otherwise, geoIP will locate this event.
- **referer**: Define the Referer. `null` for server calls.


### user.traits(properties, context)

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

## Utils

### traits.group()

The Hull API returns traits in a "flat" format, with '/' delimiters in the key.
`client.utils.traits.group(user_report)` can be used to group those traits into subobjects:

```js
client.utils.traits.group({
  mail: "romain@user",
  name: "name",
  "traits_coconut_name": "coconut",
  "traits_coconut_size": "large",
  "traits_cb/twitter_bio": "parisian",
  "traits_cb/twitter_name": "parisian",
  "traits_group/name": "groupname",
  "traits_zendesk/open_tickets": 18
});

// returns
{
  id : "31628736813n1283",
  email: "romain@user",
  name: "name",
  traits: {
    coconut_name: "coconut",
    coconut_size: "large"
  },
  cb: {
    twitter_bio: "parisian",
    twitter_name: "parisian"
  },
  group: {
    name: "groupname"
  },
  zendesk: {
    "open_tickets": 18
  }
};
```

This utility can be also used in following way:

```js
const client = new Hull({ config });
const userGroupedTraits = client.utils.traits.group(user_report);
```

## Logging Methods

The Logger comes in two flavors, `Hull.logger.xxx` and `hull.logger.xxx` - The first one is a generic logger, the second one injects the current instance of `Hull` so you can retreive ship name, id and organization for more precision.

Uses [Winston](https://github.com/winstonjs/winston)

```js
Hull.logger.info("message", { object }); //Class logging method,
client.logger.info("message", { object }); //Instance logging method, adds Ship ID and Organization to Context. Use if available.

//Debug works the same way but only logs if process.env.DEBUG===true
Hull.logger.info("message", { object }); //Class logging method,
client.logger.info("message", { object });

//You can add more logging destinations like this:
import winstonSlacker from "winston-slacker";
Hull.logger.add(winstonSlacker,  { ... });

```

You can also have a user or account scoped logger. Claims used in `asUser` and `asAccount` methods will be added to the log context.

```js
const user = client.asUser({ email: "john@coltrane.com" });
user.logger.info("message", { hello: "world" });
```


## Setting a requestId in the logs context

You can decorate all your logs context with a `request_id` which allows you to group all logs related to a particular request or transaction. 

This identifier can be passed a `requestId` param at the initialization of the Client.

```js
const client = new Hull({
  organization:"193a8881.hullapp.io",
  id:"59e99ec13cd60e5c9d000037",
  secret: "change-me-please",
  requestId:"123"
});
> client.logger.info("hello");
```

will log the following line

```js
{"context":{"organization":"193a8881.hullapp.io","id":"59e99ec13cd60e5c9d000037","request_id":"123"},"level":"info","message":"hello"}
```

## Options

* **hostSecret**
    > The ship hosted secret - consider this as a private key which is used to encrypt and decrypt `req.hull.token`. The token is useful for exposing it outside the Connector <-> Hull Platform communication. For example the OAuth flow or webhooks. Thanks to the encryption no 3rd party will get access to Hull Platform credentials.

* **clientConfig**
    > Additional config which will be passed to the new instance of Hull Client
