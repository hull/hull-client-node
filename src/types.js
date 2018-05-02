// @flow

/*
 * COMMON TYPEs
 */
export type HullAttributeName = string;
export type HullAttributeValue = string | boolean | Array<string> | number;
export type HullAttributeOperation = {
  operation: string,
  value: HullAttributeValue
};
export type HullEntityType = "account" | "user";

/*
 * DATA STRUCTURES TO WRITE TO PLATFORM
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
 * DATA STRUCTURES TO READ FROM PLATFORM
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
