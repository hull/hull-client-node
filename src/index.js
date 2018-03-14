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
 * HullClient
 *
 * @class
 * @public
 * @param {Object} config [description]
 * @param {string} config.id [description]
 * @param {string} config.secret [description]
 * @param {string} config.organization [description]
 * @param {string} [config.firehoseUrl=]
 * @param {string} [config.protocol=https]
 * @param {string} [config.prefix=/api/v1]
 *
 * @example
 * const Hull = require("hull-client");
 * const client = new Hull({
 *   id: "HULL_ID",
 *   secret: "HULL_SECRET",
 *   organization: "HULL_ORGANIZATION_DOMAIN"
 * });
 */
const HullClient = function HullClient(config = {}) {
  if (!(this instanceof HullClient)) { return new HullClient(config); }

  const clientConfig = new Configuration(config);

  /**
   * Returns the global configuration object.
   *
   * @public
   * @return {Object} current hullClient configuration parameters
   * @example
   * {
   *   prefix: '/api/v1',
   *   domain: 'hullapp.io',
   *   protocol: 'https',
   *   id: '58765f7de3aa14001999',
   *   secret: '12347asc855041674dc961af50fc1',
   *   organization: 'fa4321.hullapp.io',
   *   version: '0.11.4'
   * }
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
   * @function get
   * @alias api.get
   * @public
   * @memberof HullClient#
   * @param {string} url
   * @param {Object} [params]
   * @param {Object} [options={}]
   * @param {Number} [options.timeout] option controls if the client should retry the request if the client timeout error happens or if there is an error 503 returned serverside - the value of the option is applied for client side error
   * @param {Number} [options.retry] controls the time between timeout or 503 error occurence and the next retry being done
   */
  /**
   * @function post
   * @alias api.post
   * @public
   * @memberof HullClient#
   * @param {string} url
   * @param {Object} [params]
   * @param {Object} [options={}]
   * @param {Number} [options.timeout] option controls if the client should retry the request if the client timeout error happens or if there is an error 503 returned serverside - the value of the option is applied for client side error
   * @param {Number} [options.retry] controls the time between timeout or 503 error occurence and the next retry being done
   */
  /**
   * @function put
   * @alias api.put
   * @public
   * @memberof HullClient#
   * @param {string} url
   * @param {Object} [params]
   * @param {Object} [options={}]
   * @param {Number} [options.timeout] option controls if the client should retry the request if the client timeout error happens or if there is an error 503 returned serverside - the value of the option is applied for client side error
   * @param {Number} [options.retry] controls the time between timeout or 503 error occurence and the next retry being done
   */
  /**
   * @function del
   * @alias api.del
   * @public
   * @memberof HullClient#
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
   * @param  {Object} claims additionalClaims
   * @return {string}        [description]
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
     * @memberof HullClient
     * @method   util.groupTraits
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
     * Sets attributes on the user or account
     *
     * @public
     * @param  {Object} traits            And object with new attributes
     * @param  {Object} [context={}]
     * @param  {string} [context.source=] Optional source prefix
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
     * @public
     * @param  {string} event      event name
     * @param  {Object} properties event properties, additional information about event
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

    // Allow alias only for users
    if (config.userClaim || config.accessToken) {
      /**
       * @public
       * @param  {[type]} body [description]
       * @return {[type]}      [description]
       */
      this.alias = (body) => {
        return batch({
          type: "alias",
          body
        });
      };
    }

    if (config.userClaim) {
      /**
       * @public
       * @param  {Object} accountClaim [description]
       * @return {[type]}              [description]
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
     * @deprecated Use asUser instead
     */
    this.as = (userClaim, additionalClaims = {}) => {
      this.logger.warn("client.deprecation", { message: "use client.asUser instead of client.as" });
      return this.asUser(userClaim, additionalClaims);
    };

    /**
     * Eeturns client scoped to User Claims
     *
     * @public
     * @param  {Object} userClaim
     * @param  {Object} additionalClaims
     * @throws {Error} If no valid claims are passed
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
     * Returns an instance scoped to account claims
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
