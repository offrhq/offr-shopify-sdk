import { z } from "npm:zod@3.23.8";

import {
  SellingPlanGroupInputSchema,
  SellingPlanGroupResourceInputSchema,
  SellingPlanInputSchema,
} from "./gql/admin.2024-07.graphql.ts";

/**
 * To provide helpful error messages to the shopper,
 * Offr requires error response to conform to this schema.
 *
 * Without this, the shopper will be presented with a generic error.
 */
export const errorBodySchema = z.object({
  success: z.literal(false),
  /** The message shown to the shopper */
  publicMessage: z.string(),
  /**
   * Debug information which will be stored in `Shopify Admin / Content (Metaobjects) / Log (Offr)`.
   * This data is not conveyed to the client browser;
   * it is only available through your Shopify admin
   */
  privateError: z.any(),
});
export type ErrorBody = z.infer<typeof errorBodySchema>;

/**
 * The data portion of a successful response from an endpoint.
 * @see calculationSuccessBodySchema
 */
export const calculationSuccessDataSchema = z
  .object({
    /**
     * Same as Shopify `sellingPlanGroupInput`
     * https://shopify.dev/docs/api/admin-graphql/2024-07/input-objects/SellingPlanGroupInput
     *
     * With additional restrictions:
     * * no sellingPlansToDelete
     * * no sellingPlansToUpdate
     * * no appId
     * * create at least one sellingPlan
     */
    sellingPlanGroupInput: SellingPlanGroupInputSchema()
      .omit({
        sellingPlansToDelete: true, // not allowed
        sellingPlansToUpdate: true, // not allowed
        appId: true, // not allowed
      })
      // at least one selling plan is required
      .merge(
        z.object({
          sellingPlansToCreate: z.array(SellingPlanInputSchema()).min(1),
        })
      )
      .strict(), // give an error when attempting to add other properties

    /**
     * OPTIONAL: The products/variants which receive this plan.
     * If not provided, Offr will automatically associate
     * the product and variants received.
     *
     * Note Shopify calls these 'ID', however it expects GID strings.
     */
    resources: SellingPlanGroupResourceInputSchema().optional(),

    /**
     * an ISO 8601 date string (ex: `2030-10-11T14:30:00Z`)
     * which represents the activation time the plan(s)
     *
     * for example:
     * set it to a future time to schedule public ticket sales
     */
    validFrom: z.string().datetime(),

    /**
     * an ISO 8601 date string (ex: `2030-10-11T14:30:00Z`)
     * which represents the deactivation time of the plan(s)
     *
     * for example:
     * set it 3 hours in the future to require checkout within 3 hours
     */
    validUntil: z.string().datetime(),

    /**
     * Array of key-value tuples to show in cart and order summary,
     * such as to show shopper customizations.
     *
     * @example
     * [["Dimensions","12x24x33"],["Requested","2030-10-11T14:30:00Z"]]
     */
    customAttributes: z.array(z.tuple([z.string(), z.string()])),
  })
  .strict(); // give an error when attempting to add other properties
export type SuccessData = z.infer<typeof calculationSuccessDataSchema>;

/** To succeed, the endpoint response JSON must conform to this schema */
export const calculationSuccessBodySchema = z.object({
  success: z.literal(true),
  data: calculationSuccessDataSchema
    // sanity check: not already expired
    // refine here otherwise it makes the schema hard to extend
    .refine(
      (res) => new Date(res.validUntil).valueOf() > new Date().valueOf(),
      `'validUntil' is already expired. It must expire in the future.`
    )
    // sanity check: must not expire before activation
    .refine(
      (res) =>
        new Date(res.validUntil).valueOf() > new Date(res.validFrom).valueOf(),
      `'validUntil' must expire after 'validFrom'.`
    ),
});
export type SuccessBody = z.infer<typeof calculationSuccessBodySchema>;

export const calculationResponseBodySchema = z.discriminatedUnion("success", [
  calculationSuccessBodySchema,
  errorBodySchema,
]);
export type CalculationResponse = z.infer<typeof calculationResponseBodySchema>;

export const appSuccessData = calculationSuccessDataSchema
  .omit({ sellingPlanGroupInput: true })
  .extend({
    /** the group for this set of plans and its GID */
    sellingPlanGroup: calculationSuccessDataSchema.shape.sellingPlanGroupInput
      .omit({
        sellingPlansToCreate: true,
      })
      .extend({
        /** the GID of the selling plan group */
        id: z.string(),
      }),

    /** selling plans and their respective GIDs */
    sellingPlans:
      calculationSuccessDataSchema.shape.sellingPlanGroupInput.shape.sellingPlansToCreate.element
        .merge(
          z.object({
            /** the GID of the selling plan */
            id: z.string(),
          })
        )
        .array(),
  });

/** Offr responses back to the shopper conform to this schema */
export const appResponseBodySchema = z.discriminatedUnion("success", [
  //Success data is similar to formula response plus injected IDs
  z.object({
    success: z.literal(true),
    data: appSuccessData,
  }),

  // error response to shopper does not contain private information
  z.object({
    success: z.literal(false),
    message: z.string(),
  }),
]);
export type AppResponseBody = z.infer<typeof appResponseBodySchema>;
