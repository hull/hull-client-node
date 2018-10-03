// @flow

const propertiesUtils = require("./utils/properties");
const settingsUtils = require("./utils/settings");
const traitsUtils = require("./utils/traits");

/*
 * --- Basic Types ---
 */

/**
 * All attribtues names are strings
 */
export type HullAttributeName = string;

/**
 * These are possible values
 */
export type HullAttributeValue = string | boolean | Array<string> | number;

/**
 * When writing attributes we can specify both the value with operation
 * @see https://www.hull.io/docs/references/api/#user-attributes
 */
export type HullAttributeOperation = {|
  operation: "set" | "setIfNull" | "inc" | "dec",
  value: HullAttributeValue
|};

/**
 * Possible entity types
 */
export type HullEntityType = "account" | "user";

export type HullConnectorSettings = {
  [HullConnectorSettingName: string]: any
};

type HullManifestSetting = {
  [string]: any
};

export type HullNotificationHandlerOptions = {
  disableErrorHandling?: boolean,
  maxTime?: number,
  maxSize?: number,
}
type HullNotificationHandlerChannel = {
  handler: string,
  options: HullNotificationHandlerOptions
};

/**
 * A Manifest Notification block. Defines a route for Hull to send Notifications to.
 */
type HullManifestNotification = {
  url: string,
  channels: {
    [channelName: string]: HullNotificationHandlerChannel
  }
};

/**
 * A Manifest Batch block. Defines a route for Hull to send Notifications to.
 */
type HullManifestBatch = {
  url: string,
  channels: {
    [channelName: string]: HullNotificationHandlerChannel
  }
};

/**
 * A Manifest Schedule block. Defines a schedule for Hull to ping the connector
 */
export type HullSchedulerHandlerOptions = {
   disableErrorHandling?: boolean
 };
type HullManifestSchedule = {
  url: string,
  handler: string,
  interval: string,
  options?: HullSchedulerHandlerOptions
};

/**
 * A Manifest Endpoint block. Defines a publicly-available route
 * for the Connector to receive Service data
 */
export type HullExternalHandlerOptions = {
  respondWithError?: boolean,
  disableErrorHandling?: boolean,
  [string]: any
}
type HullManifestEndpoint = {
  url: string,
  handler: string,
  method: "get" | "post" | "put" | "patch" | "delete",
  options?: HullExternalHandlerOptions
};

/**
 * A Manifest Tab config. Defines a route to display a screen in the Dashboard
 */
type HullManifestTabConfig = {
  title: string,
  url: string,
  handler: string,
  options?: HullExternalHandlerOptions,
  size: "small" | "large",
  editable: boolean
};

/**
 * Manifest. Defines a Connector's exposed endpoints and features
 */
export type HullManifest = {
  name: string,
  description: string,
  tags: Array<"batch" | "batch-accounts" | "kraken">,
  source: string,
  logo: string,
  picture: string,
  readme: string,
  version: string,
  tabs: Array<HullManifestTabConfig>,
  schedules?: Array<HullManifestSchedule>,
  status?: Array<HullManifestSchedule>,
  subscriptions?: Array<HullManifestNotification>,
  batch?: Array<HullManifestBatch>,
  endpoints?: Array<HullManifestEndpoint>,
  deployment_settings: Array<HullManifestSetting>,
  settings?: Array<HullManifestSetting>,
  private_settings?: Array<HullManifestSetting>
};

/**
 * Connector (also called ship) object with settings, private settings and manifest.json
 * Used for both read and write operations
 */
export type HullConnector = {
  id: string,
  updated_at: string,
  created_at: string,
  name: string,
  description: string,
  tags: Array<string>,
  source_url: string,
  index: string,
  picture: string,
  homepage_url: string,
  manifest_url: string,
  manifest: HullManifest,
  settings: HullConnectorSettings,
  private_settings: HullConnectorSettings,
  status: Object
};

export type HullSegmentType = "users_segment" | "accounts_segment";

/**
 * An object representing the Hull Segment
 * Used in read operations
 */
export type HullSegment = {
  id: string,
  name: string,
  type: HullSegmentType,
  stats: {
    users?: number,
    accounts?: number // is it really there?
  },
  created_at: string,
  updated_at: string
};

/*
 * --- Data Structures To Use When Writing To Platform ---
 */

/**
 * This are claims we can use to identify account
 */
export type HullAccountClaims = {
  id?: ?string,
  domain?: ?string,
  external_id?: ?string,
  anonymous_id?: ?string
};

/**
 * This are claims we can use to identify user
 */
export type HullUserClaims = {
  id?: ?string,
  email?: ?string,
  external_id?: ?string,
  anonymous_id?: ?string
};

/**
 * This is a combined entity claims type. It's either account or user claims
 */
export type HullEntityClaims = HullUserClaims | HullAccountClaims;

/**
 * Additional claims which can be added to the main identity claims,
 * both for users and account which change resolution behavior
 */
export type HullAdditionalClaims = {|
  create?: boolean,
  scopes?: Array<string>,
  active?: boolean
|};

/**
 * This is a hash object which allows to set traits on account.
 * This are direct attribute values or operation definitions
 */
export type HullAccountAttributes = {
  [HullAttributeName]: HullAttributeValue | HullAttributeOperation
};

/**
 * This is a hash object which allows to set traits on user.
 * This are direct attribute values or operation definitions
 */
export type HullUserAttributes = {
  [HullAttributeName]: HullAttributeValue | HullAttributeOperation
};

/**
 * This is a combined entity attributes type. It's either account or user attributes
 */
export type HullEntityAttributes = HullAccountAttributes | HullUserAttributes;

/**
 * This is an event name which we use when tracking an event
 */
export type HullEventName = string;

/**
 * These are event's properties which we use when tracking an event
 */
export type HullEventProperties = {
  [HullEventProperty: string]: HullAttributeValue
};

/**
 * This is additional context passed with event
 */
export type HullEventContext = {
  location?: {},
  page?: {
    referrer?: string
  },
  referrer?: {
    url: string
  },
  os?: {},
  useragent?: string,
  ip?: string | number
};

/*
 * --- Data Structures To Use When Reading From Platform ---
 */

/**
 * Combined ident and attributes object for account coming from platform
 */
export type HullAccount = {
  id?: string,
  domain?: ?string,
  external_id?: ?string,
  anonymous_ids?: ?Array<string>,
  anonymous_id?: ?string, // TODO: Flow Workaround -> force anonymous_id to be recognized as a ?string, Should be forced on Platform for safety
  name?: ?string,
  [HullAttributeName]: HullAttributeValue
};

/**
 * Combined ident and attributes object for user coming from platform
 */
export type HullUser = {
  id: string,
  email?: ?string,
  external_id: ?string,
  anonymous_ids: ?Array<string>,
  anonymous_id?: ?string, // TODO: Flow Workaround -> force anonymous_id to be recognized as a ?string, Should be forced on Platform for safety
  segment_ids: Array<string> | null,
  domain?: ?string,
  [HullAttributeName]: HullAttributeValue
};

/**
 * Common entity type, can be any user or account
 */
export type HullEntity = HullAccount | HullUser;

/**
 * Event coming from platform
 */
export type HullEvent = {
  event_id: string,
  event: HullEventName,
  created_at: string,
  event_source?: string,
  event_type?: string,
  track_id?: string,
  user_id?: string,
  anonymous_id?: ?string,
  session_id?: string,
  ship_id?: string,
  app_id?: string,
  app_name?: string,
  context: HullEventContext,
  properties: HullEventProperties
};

/**
 * Attributes (traits) changes is an object map where keys are attribute (trait) names and value is an array
 * where first element is an old value and second element is the new value.
 * This object contain information about changes on one or multiple attributes (that's thy attributes and changes are plural).
 */
export type HullAttributesChanges = {|
  [HullAttributeName]: [HullAttributeValue, HullAttributeValue]
|};

/**
 * Represents segment changes in TUserChanges.
 * The object contains two params which mark which segments user left or entered.
 * It may contain none, one or multiple HullSegment in both params.
 */
export type HullSegmentsChanges = {|
  entered?: Array<HullSegment>,
  left?: Array<HullSegment>
|};

/**
 * Object containing all changes related to User in HullUserUpdateMessage
 */
export type HullUserChanges = {|
  is_new: boolean,
  user: HullAttributesChanges,
  account: HullAttributesChanges,
  segment_ids: Array<string>,
  segments: HullSegmentsChanges, // should be segments or user_segments?
  account_segments: HullSegmentsChanges // should be segments or user_segments?
|};

/**
 * Object containing all changes related to Account in HullUserUpdateMessage
 */
export type HullAccountChanges = {|
  is_new: boolean,
  account: HullAttributesChanges,
  account_segments: HullSegmentsChanges // should be segments or user_segments?
|};

/**
 * A message sent by the platform when any event, attribute (trait) or segment change happens on the user.
 */
export type HullUserUpdateMessage = {|
  user: HullUser,
  changes: HullUserChanges,
  segments: Array<HullSegment>,
  account_segments: Array<HullSegment>,
  events: Array<HullEvent>,
  account: HullAccount,
  message_id: string
|};

// TODO: What does a segment update message look like
export type HullSegmentUpdateMessage = {}
// TODO: What does a segment delete message look like
export type HullSegmentDeleteMessage = {}
// TODO: What does a user delete message look like
export type HullUserDeleteMessage = {}
// TODO: What does a account delete message look like
export type HullAccountDeleteMessage = {}
// TODO: What does a connector update message look like
export type HullConnectorUpdateMessage = {}

/**
 * A message sent by the platform when any attribute (trait) or segment change happens on the account.
 */
export type HullAccountUpdateMessage = {|
  changes: HullAccountChanges,
  account_segments: Array<HullSegment>, // should be segments or account_segments?
  events: Array<HullEvent>,
  account: HullAccount,
  message_id: string
|};

/**
 * The whole notification object
 */
export type HullNotification = {
  notification_id: string,
  configuration: {
    id: string,
    secret: string,
    organization: string
  },
  channel: string,
  connector: HullConnector,
  segments: Array<HullSegment>,
  accounts_segments: Array<HullSegment>,
  messages?: Array<HullUserUpdateMessage | HullAccountUpdateMessage>
};

/*
 * --- Hull Client Types ---
 */

/**
 * Configuration which can be passed to the HullClient constructor
 * We cannot use exact type here.
 */
export type HullClientConfiguration = {
  id?: string,
  secret?: string,
  organization?: string,
  domain?: string,
  namespace?: string,
  requestId?: string,
  connectorName?: string,
  firehoseUrl?: ?string,
  protocol?: string,
  prefix?: string,
  logLevel?: "info" | "error" | "warn" | "debug",
  userClaim?: string | HullUserClaims,
  accountClaim?: string | HullAccountClaims,
  subjectType?: HullEntityType,
  additionalClaims?: HullAdditionalClaims,
  accessToken?: string,
  hostSecret?: string,
  flushAt?: number,
  flushAfter?: number,
  version?: string,
  logs?: Array<Object>,
  firehoseEvents?: Array<Object>,
  captureLogs?: boolean,
  captureFirehoseEvents?: boolean
};

/**
 * Definition of logger object on HullClient instance
 */
export type HullClientLogger = {|
  log: (string, Object) => void,
  silly: (string, Object) => void,
  debug: (string, Object) => void,
  verbose: (string, Object) => void,
  info: (string, Object) => void,
  warn: (string, Object) => void,
  error: (string, Object) => void
|};

// Definition of static logger param available on HullClient class
export type HullClientStaticLogger = {|
  ...HullClientLogger,
  transports: Object
|};

/**
 * Definition of utilities object
 */
export type HullClientUtils = {|
  traits: typeof traitsUtils,
  settings: typeof settingsUtils,
  properties: typeof propertiesUtils
|};

export type HullProperties = {
  [HullPropertyName: string]: {
    id: string,
    text: string,
    type: string,
    id_path: Array<string>,
    path: Array<string>,
    title: string,
    key: string
  }
};
