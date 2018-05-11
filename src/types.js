// @flow

/*
 * ATTRIBUTES TYPES
 */
export type HullAttributeName = string; // all attribtues names are strings
export type HullAttributeValue = string | boolean | Array<string> | number; // these are possible values
export type HullAttributeOperation = { // when writing attributes we can specify both the value with operation
  operation: "set" | "setIfNull" | "inc" | "dec", // @see https://www.hull.io/docs/references/api/#user-attributes
  value: HullAttributeValue
};
export type HullEntityType = "account" | "user";

/*
 * DATA STRUCTURES TO USE WHEN WRITING TO PLATFORM
 */

// separate claims to find entity
export type HullAccountClaims = {
  id?: string;
  domain?: string;
  external_id?: string;
};
export type HullUserClaims = {
  id?: string;
  email?: string;
  external_id?: string;
  anonymous_id?: string;
};
export type HullEntityClaims = HullUserClaims | HullAccountClaims;
export type HullAuxiliaryClaims = {
  create?: boolean,
  active?: boolean
};

// traits setters - direct values or `operation`
export type HullAccountAttributes = {
  [HullAttributeName]: HullAttributeValue | HullAttributeOperation;
};
export type HullUserAttribtues = {
  [HullAttributeName]: HullAttributeValue | HullAttributeOperation;
};
export type HullEntityAttributes = HullAccountAttributes | HullUserAttribtues;

export type HullEntityAttributesOptions = {
  source?: string,
  sync?: boolean
};

// separate stuff to create/write an event
export type HullEventName = string;
export type HullEventProperties = {
  [HullEventProperty: string]: string
};
export type HullEventContext = {
  [HullEventProperty: string]: string
};

/*
 * DATA STRUCTURES TO USE WHEN READING FROM PLATFORM
 */

// combined ident and attributes
export type HullAccount = {
  id: string,
  domain: string,
  external_id: string,
  [HullAttributeName]: HullAttributeValue
};
export type HullUser = {
  id: string,
  email: string,
  external_id: string,
  anonymous_ids: Array<string>,
  [HullAttributeName]: HullAttributeValue;
};
export type HullEntity = HullAccount | HullUser;

// Entity event coming from platform
export type HullEvent = {
  event_id: string;
  event: string;
  created_at: string;
  event_source?: string;
  event_type?: string;
  track_id?: string;
  user_id?: string;
  anonymous_id?: string;
  session_id?: string;
  ship_id?: string;
  app_id?: string;
  app_name?: string;
  context: HullEventContext;
  properties: HullEventProperties;
};

/*
 * Hull Client Types
 */
export type HullClientConfiguration = {
  id: string,
  secret: string,
  organization: string,
  requestId?: string,
  connectorName?: string,
  firehoseUrl?: string,
  protocol?: string,
  prefix?: string,
  userClaim?: HullUserClaims,
  accountClaim?: HullAccountClaims,
  subjectType?: HullEntityType,
  additionalClaims?: HullAuxiliaryClaims,
  accessToken?: string,
  hostSecret?: string,
  flushAt?: number,
  flushAfter?: number
};

export type HullClientLogger = {
  log: (string, Object) => void,
  silly: (string, Object) => void,
  debug: (string, Object) => void,
  verbose: (string, Object) => void,
  info: (string, Object) => void,
  warn: (string, Object) => void,
  error: (string, Object) => void
};

export interface HullClientBaseInterface {
  configuration(): HullClientConfiguration;
  get(url: string, method: string, params: Object, options?: Object): Promise<*>;
  post(url: string, method: string, params: Object, options?: Object): Promise<*>;
  del(url: string, method: string, params: Object, options?: Object): Promise<*>;
  put(url: string, method: string, params: Object, options?: Object): Promise<*>;
  api: {
    get(url: string, method: string, params: Object, options?: Object): Promise<*>;
    post(url: string, method: string, params: Object, options?: Object): Promise<*>;
    del(url: string, method: string, params: Object, options?: Object): Promise<*>;
    put(url: string, method: string, params: Object, options?: Object): Promise<*>;
  };
  logger: HullClientLogger;
  token(): void;
  utils: {
    groupTraits(): void,
    traits: {
      group(): void
    },
    properties: {
      get(): void
    },
    settings: {
      update(): void
    }
  };
}

export interface ScopedHullClientInterface extends HullClientBaseInterface {
  alias(body: Object): Promise<*>;
  track(event: HullEventName, properties?: HullEventProperties, context?: HullEventContext): Promise<*>;
  traits(traits: HullEntityAttributes, context?: HullEntityAttributesOptions): Promise<*>;

  asUser(userClaim: HullUserClaims, additionalClaims?: HullAuxiliaryClaims): ScopedHullClientInterface;
  as(userClaim: HullUserClaims, additionalClaims?: HullAuxiliaryClaims): ScopedHullClientInterface;
  asAccount(accountClaim: HullAccountClaims, additionalClaims?: HullAuxiliaryClaims): ScopedHullClientInterface;
  account(accountClaim?: HullAccountClaims): ScopedHullClientInterface;
}

export interface HullClientInterface extends HullClientBaseInterface {
  asUser(userClaim: HullUserClaims, additionalClaims?: HullAuxiliaryClaims): ScopedHullClientInterface;
  as(userClaim: HullUserClaims, additionalClaims?: HullAuxiliaryClaims): ScopedHullClientInterface;
  asAccount(accountClaim: HullAccountClaims, additionalClaims?: HullAuxiliaryClaims): ScopedHullClientInterface;
  account(accountClaim?: HullAccountClaims): ScopedHullClientInterface;
}
