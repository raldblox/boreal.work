/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as artifacts from "../artifacts.js";
import type * as chats from "../chats.js";
import type * as commerce from "../commerce.js";
import type * as commerceCore from "../commerceCore.js";
import type * as fulfillments from "../fulfillments.js";
import type * as inboxApi from "../inboxApi.js";
import type * as intents from "../intents.js";
import type * as matching from "../matching.js";
import type * as payouts from "../payouts.js";
import type * as profileAnalytics from "../profileAnalytics.js";
import type * as profiles from "../profiles.js";
import type * as proposals from "../proposals.js";
import type * as requestApi from "../requestApi.js";
import type * as serviceProviders from "../serviceProviders.js";
import type * as supplies from "../supplies.js";
import type * as transactionScenarios from "../transactionScenarios.js";
import type * as validators from "../validators.js";
import type * as wallets from "../wallets.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  artifacts: typeof artifacts;
  chats: typeof chats;
  commerce: typeof commerce;
  commerceCore: typeof commerceCore;
  fulfillments: typeof fulfillments;
  inboxApi: typeof inboxApi;
  intents: typeof intents;
  matching: typeof matching;
  payouts: typeof payouts;
  profileAnalytics: typeof profileAnalytics;
  profiles: typeof profiles;
  proposals: typeof proposals;
  requestApi: typeof requestApi;
  serviceProviders: typeof serviceProviders;
  supplies: typeof supplies;
  transactionScenarios: typeof transactionScenarios;
  validators: typeof validators;
  wallets: typeof wallets;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
