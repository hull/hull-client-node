// @flow

const propertiesUtils = require("./utils/properties");
const settingsUtils = require("./utils/settings");
const traitsUtils = require("./utils/traits");

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
export type HullAccountClaims = string | {
  id?: string;
  domain?: string;
  external_id?: string;
};
export type HullUserClaims = string | {
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
  id?: string,
  secret?: string,
  organization?: string,
  domain?: string,
  namespace?: string,
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
  flushAfter?: number,
  version?: string
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

export type HullClientUtils = {
  groupTraits: traitsUtils.group,
  traits: typeof traitsUtils,
  settings: typeof settingsUtils,
  properties: typeof propertiesUtils,
};
