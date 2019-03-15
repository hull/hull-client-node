const _ = require("lodash");
const winston = require("winston");
const uuidV4 = require("uuid/v4");

const Configuration = require("./lib/configuration");
const restAPI = require("./lib/rest-api");
const crypto = require("./lib/crypto");
const Firehose = require("./lib/firehose");

const traitsUtils = require("./utils/traits");
const settingsUtils = require("./utils/settings");
const propertiesUtils = require("./utils/properties");

const PUBLIC_METHODS = ["get", "post", "del", "put"];


const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: "info",
      json: true,
      stringify: true
    })
  ]
});

/**
 * HullClient instance constructor - creates new instance to perform API calls, issue traits/track calls and log information
 *
 * @class
 * @public
 * @param {Object} config configuration object
 * @param {string} config.id Connector ID - required
 * @param {string} config.secret Connector Secret - required
 * @param {string} config.organization Hull organization - required
 * @param {string} [config.requestId] additional parameter which will be added to logs context, it can be HTTP request unique id when you init HullClient and you want to group log lines by the request (it can be a job id etc.)
 * @param {string} [config.connectorName] additional parameter which will be added to logs context, it's used to track connector name in logs
 * @param {string} [config.firehoseUrl=] The url track/traits calls should be sent - deprecated option, will be removed in next version
 * @param {string} [config.protocol=https] protocol which will be appended to organization url, override for testing only
 * @param {string} [config.prefix=/api/v1] prefix of Hull REST API
 *
 * @example
 * const HullClient = require("hull-client");
 * const hullClient = new HullClient({
 *   id: "HULL_ID",
 *   secret: "HULL_SECRET",
 *   organization: "HULL_ORGANIZATION_DOMAIN"
 * });
 */
/**
 * Following methods are available when `HullClient` instance is scoped to user or account.
 * How to get scoped client? Use `asUser` or `asAccount` methods.
 *
 * @namespace ScopedHullClient
 * @public
 * @example
 * const hullClient = new HullClient({ id, secret, organization });
 * const scopedHullClient = hullClient.asUser({ email: "foo@bar.com "});
 * scopedHullClient.traits({ new_attribute: "new_value" });
 */
/**
 * Following methods allows to perform api calls again Hull REST API.
 * Their are available on `HullClient` and scoped HullClient.
 *
 * @namespace Api
 * @public
 */
/**
 * Following methods are helper utilities. They are available under `utils` property
 *
 * @namespace Utils
 * @public
 */
const HullClient = function HullClient(config) {
  if (!(this instanceof HullClient)) { return new HullClient(config); }

  const clientConfig = new Configuration(config);

  /**
   * Returns the global configuration object.
   *
   * @public
   * @return {Object} current `HullClient` configuration parameters
   * @example
   * const hullClient = new HullClient({});
   * hullClient.configuration() == {
   *   prefix: "/api/v1",
   *   domain: "hullapp.io",
   *   protocol: "https",
   *   id: "58765f7de3aa14001999",
   *   secret: "12347asc855041674dc961af50fc1",
   *   organization: "fa4321.hullapp.io",
   *   version: "0.13.10"
   * };
   */
  this.configuration = function configuration() {
    return clientConfig.get();
  };

  const batch = Firehose.getInstance(clientConfig.get(), (params, batcher) => {
    const firehoseUrl = clientConfig.get("firehoseUrl") || `${clientConfig.get("protocol")}://firehose.${clientConfig.get("domain")}`;
    return restAPI(this, batcher.config, firehoseUrl, "post", params, {
      timeout: process.env.BATCH_TIMEOUT || 10000,
      retry: process.env.BATCH_RETRY || 5000
    });
  });

  this.api = function api(url, method, params, options = {}) {
    return restAPI(this, clientConfig, url, method, params, options);
  };

  /**
   * Performs a GET HTTP request on selected url of Hull REST API (prefixed with `prefix` param of the constructor)
   * @function get
   * @public
   * @memberof Api#
   * @param {string} url
   * @param {Object} [params]
   * @param {Object} [options={}]
   * @param {Number} [options.timeout] option controls if the client should retry the request if the client timeout error happens or if there is an error 503 returned serverside - the value of the option is applied for client side error
   * @param {Number} [options.retry] controls the time between timeout or 503 error occurence and the next retry being done
   */
  /**
   * Performs a POST HTTP request on selected url of Hull REST API (prefixed with `prefix` param of the constructor)
   * @function post
   * @public
   * @memberof Api#
   * @param {string} url
   * @param {Object} [params]
   * @param {Object} [options={}]
   * @param {Number} [options.timeout] option controls if the client should retry the request if the client timeout error happens or if there is an error 503 returned serverside - the value of the option is applied for client side error
   * @param {Number} [options.retry] controls the time between timeout or 503 error occurence and the next retry being done
   */
  /**
   * Performs a PUT HTTP request on selected url of Hull REST API (prefixed with `prefix` param of the constructor)
   * @function put
   * @alias api.put
   * @public
   * @memberof Api#
   * @param {string} url
   * @param {Object} [params]
   * @param {Object} [options={}]
   * @param {Number} [options.timeout] option controls if the client should retry the request if the client timeout error happens or if there is an error 503 returned serverside - the value of the option is applied for client side error
   * @param {Number} [options.retry] controls the time between timeout or 503 error occurence and the next retry being done
   */
  /**
   * Performs a DELETE HTTP request on selected url of Hull REST API (prefixed with `prefix` param of the constructor)
   * @function del
   * @alias api.del
   * @public
   * @memberof Api#
   * @param {string} url
   * @param {Object} [params]
   * @param {Object} [options={}]
   * @param {Number} [options.timeout] option controls if the client should retry the request if the client timeout error happens or if there is an error 503 returned serverside - the value of the option is applied for client side error
   * @param {Number} [options.retry] controls the time between timeout or 503 error occurence and the next retry being done
   */
  _.each(PUBLIC_METHODS, (method) => {
    this[method] = (url, params, options = {}) => {
      return restAPI(this, clientConfig, url, method, params, options);
    };
    this.api[method] = (url, params, options = {}) => {
      return restAPI(this, clientConfig, url, method, params, options);
    };
  });

  /**
   * Used for [Bring your own users](http://hull.io/docs/users/byou).
   * Creates a signed string for the user passed in hash. `userHash` needs an `email` field.
   * [You can then pass this client-side to Hull.js](http://www.hull.io/docs/users/byou) to authenticate users client-side and cross-domain
   *
   * @public
   * @memberof ScopedHullClient
   * @param  {Object} claims additionalClaims
   * @return {string}        token
   * @example
   * hullClient.asUser({ email: "xxx@example.com", external_id: "1234" }).token(optionalClaims);
   * hullClient.asAccount({ domain: "example.com", external_id: "1234" }).token(optionalClaims);
   */
  this.token = function token(claims) {
    const subjectType = clientConfig.get("subjectType");
    const claim = clientConfig.get(`${subjectType}Claim`);
    return crypto.lookupToken(clientConfig.get(), subjectType, { [subjectType]: claim }, claims);
  };

  this.utils = {
    /**
     * @memberof Utils
     * @method   groupTraits
     * @public
     * @deprecated - use `utils.traits.group` instead
     */
    groupTraits: traitsUtils.group,
    traits: traitsUtils,
    properties: {
      get: propertiesUtils.get.bind(this),
    },
    settings: {
      update: settingsUtils.update.bind(this),
    }
  };

  const conf = this.configuration() || {};
  const ctxKeys = _.pick(conf, ["organization", "id", "connectorName", "subjectType", "requestId"]);
  const ctxe = _.mapKeys(ctxKeys, (value, key) => _.snakeCase(key));

  ["user", "account"].forEach((k) => {
    const claim = conf[`${k}Claim`];
    if (_.isString(claim)) {
      ctxe[`${k}_id`] = claim;
    } else if (_.isObject(claim)) {
      _.each(claim, (value, key) => {
        const ctxKey = _.snakeCase(`${k}_${key.toLowerCase()}`);
        if (value) ctxe[ctxKey] = value.toString();
      });
    }
  });

  const logFactory = level => (message, data) => logger[level](message, { context: ctxe, data });
  const logs = {};
  ["silly", "debug", "verbose", "info", "warn", "error"].map((level) => { logs[level] = logFactory(level); return level; });


  this.logger = {
    log: logFactory("info"),
    ...logs
  };

  if (config.userClaim || config.accountClaim || config.accessToken) {
    /**
     * Saves attributes on the user or account. Only available on User or Account scoped `HullClient` instance (see {@link #asuser} and {@link #asaccount}).
     *
     * @public
     * @memberof ScopedHullClient
     * @param  {Object} traits            object with new attributes, it's always flat object, without nested subobjects
     * @param  {Object} [context={}]
     * @param  {string} [context.source=] optional source prefix, if applied all traits will be prefixed with this string (and `/` character)
     * @param  {string} [context.sync=false] make the operation synchronous - deprecated option, will be removed in next version
     * @return {Promise}
     */
    this.traits = (traits, context = {}) => {
      // Quick and dirty way to add a source prefix to all traits we want in.
      const source = context.source;
      let body = {};
      if (source) {
        _.reduce(traits, (d, value, key) => {
          const k = `${source}/${key}`;
          d[k] = value;
          return d;
        }, body);
      } else {
        body = { ...traits };
      }

      if (context.sync === true) {
        return this.post("me/traits", body);
      }

      return batch({ type: "traits", body });
    };

    /**
     * Stores events on user. Only available on User scoped `HullClient` instance (see {@link #asuser}).
     *
     * @public
     * @memberof ScopedHullClient
     * @param  {string} event      event name
     * @param  {Object} properties additional information about event, this is a one-level JSON object
     * @param  {Object} [context={}] The `context` object lets you define event meta-data. Everything is optional
     * @param  {string} [context.source]     Defines a namespace, such as `zendesk`, `mailchimp`, `stripe`
     * @param  {string} [context.type]       Define a event type, such as `mail`, `ticket`, `payment`
     * @param  {string} [context.created_at] Define an event date. defaults to `now()`
     * @param  {string} [context.event_id]   Define a way to de-duplicate events. If you pass events with the same unique `event_id`, they will overwrite the previous one.
     * @param  {string} [context.ip]         Define the Event's IP. Set to `null` if you're storing a server call, otherwise, geoIP will locate this event.
     * @param  {string} [context.referer]    Define the Referer. `null` for server calls.
     * @return {Promise}
     */
    this.track = (event, properties = {}, context = {}) => {
      _.defaults(context, {
        event_id: uuidV4()
      });
      return batch({
        type: "track",
        body: {
          ip: null,
          url: null,
          referer: null,
          ...context,
          properties,
          event
        }
      });
    };


    /**
     * Issues an `alias` event on user? or account?
     * @todo
     * @memberof ScopedHullClient
     * @public
     * @param  {Object} body
     * @return {Promise}
     */
    this.alias = (body) => {
      return batch({
        type: "alias",
        body
      });
    };

    /**
     * Issues an `unalias` event on user? or account?
     * @todo
     * @memberof ScopedHullClient
     * @public
     * @param  {Object} body
     * @return {Promise}
     */
    this.unalias = (body) => {
      return batch({
        type: "unalias",
        body
      });
    };

    if (config.userClaim) {
      /**
       * Available only for User scoped `HullClient` instance (see {@link #asuser}).
       * Returns `HullClient` instance scoped to both User and Account, but all traits/track call would be performed on the User, who will be also linked to the Account.
       *
       * @public
       * @memberof ScopedHullClient
       * @param  {Object} accountClaim [description]
       * @return {HullClient} HullClient scoped to a User and linked to an Account
       */
      this.account = (accountClaim = {}) => {
        if (!accountClaim) {
          return new HullClient({ ...config, subjectType: "account" });
        }
        return new HullClient({ ...config, subjectType: "account", accountClaim });
      };
    }
  } else {
    /**
     * @public
     * @deprecated Use `asUser` instead
     */
    this.as = (userClaim, additionalClaims = {}) => {
      this.logger.warn("client.deprecation", { message: "use client.asUser instead of client.as" });
      return this.asUser(userClaim, additionalClaims);
    };

    /**
     * Takes User Claims (link to User Identity docs) and returnes `HullClient` instance scoped to this User.
     * This makes {@link #traits} and {@link #track} methods available.
     *
     * @public
     * @param {Object} userClaim
     * @param {Object}  [additionalClaims={}]
     * @param {boolean} [additionalClaims.create=true] marks if the user should be lazily created if not found
     * @param {Array}   [additionalClaims.scopes=[]] adds scopes claim to the JWT to impersonate a User with admin rights
     * @param {string}  [additionalClaims.active=false] marks the user as _active_ meaning a reduced latency at the expense of scalability. Don't use for high volume updates
     *
     * @throws {Error} if no valid claims are passed
     * @return {HullClient}
     */
    this.asUser = (userClaim, additionalClaims = {}) => {
      if (!userClaim) {
        throw new Error("User Claims was not defined when calling hull.asUser()");
      }
      return new HullClient({
        ...config, subjectType: "user", userClaim, additionalClaims
      });
    };

    /**
     * Takes Account Claims (link to User Identity docs) and returnes `HullClient` instance scoped to this Account.
     * This makes {@link #traits} method available.
     *
     * @public
     * @param  {Object} accountClaim
     * @param  {Object} additionalClaims
     * @throws {Error} If no valid claims are passed
     * @return {HullClient} instance scoped to account claims
     */
    this.asAccount = (accountClaim, additionalClaims = {}) => {
      if (!accountClaim) {
        throw new Error("Account Claims was not defined when calling hull.asAccount()");
      }
      return new HullClient({
        ...config, subjectType: "account", accountClaim, additionalClaims
      });
    };
  }
};

HullClient.logger = logger;

module.exports = HullClient;
