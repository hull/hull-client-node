import _ from "lodash";
import winston from "winston";
import uuidV4 from "uuid/v4";

import Configuration from "./lib/configuration";
import restAPI from "./lib/rest-api";
import crypto from "./lib/crypto";
import Firehose from "./lib/firehose";

import * as traitsUtils from "./utils/traits";
import * as settingsUtils from "./utils/settings";
import * as propertiesUtils from "./utils/properties";

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

const Client = function Client(config = {}) {
  if (!(this instanceof Client)) { return new Client(config); }

  const clientConfig = new Configuration(config);

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
  _.each(PUBLIC_METHODS, (method) => {
    this[method] = (url, params, options = {}) => {
      return restAPI(this, clientConfig, url, method, params, options);
    };
    this.api[method] = (url, params, options = {}) => {
      return restAPI(this, clientConfig, url, method, params, options);
    };
  });

  this.token = function token(claims) {
    const subjectType = clientConfig.get("subjectType");
    const claim = clientConfig.get(`${subjectType}Claim`);
    return crypto.lookupToken(clientConfig.get(), subjectType, { [subjectType]: claim }, claims);
  };

  this.utils = {
    // @deprecated - let's remove the `groupTraits` in favor of `traits.group` convention
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
  const ctxKeys = _.pick(conf, ["organization", "id", "connectorName", "subjectType"]);
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
      this.alias = (body) => {
        return batch({
          type: "alias",
          body
        });
      };
    }

    if (config.userClaim) {
      this.account = (accountClaim = {}) => {
        if (!accountClaim) {
          return new Client({ ...config, subjectType: "account" });
        }
        return new Client({ ...config, subjectType: "account", accountClaim });
      };
    }
  } else {
    this.as = (userClaim, additionalClaims = {}) => {
      this.logger.warn("client.deprecation", { message: "use client.asUser instead of client.as" });
      return this.asUser(userClaim, additionalClaims);
    };

    this.asUser = (userClaim, additionalClaims = {}) => {
      if (!userClaim) {
        throw new Error("User Claims was not defined when calling hull.asUser()");
      }
      return new Client({ ...config, subjectType: "user", userClaim, additionalClaims });
    };

    this.asAccount = (accountClaim, additionalClaims = {}) => {
      if (!accountClaim) {
        throw new Error("Account Claims was not defined when calling hull.asAccount()");
      }
      return new Client({ ...config, subjectType: "account", accountClaim, additionalClaims });
    };
  }
};

Client.logger = logger;

module.exports = Client;
