/**
 * Types written in Zod in case we want to validate
 * Most use cases\ just want the types and trust Shopify (no validation)
 * Bundling zod significantly increases package size
 *
 *  * Shopify doesn't provide types. These are inferred from docs
 * https://shopify.dev/docs/api/ajax/reference/product
 *
 * @note
 * Ajax types are distinct from other similar types:
 * * Not Admin Graphql
 * * Not Storefront Graphql
 * * Not Liquid object
 */
import { z } from "npm:zod@3.23.8";

const ajaxImageSchema = z.object({
  aspect_ratio: z.number(),
  height: z.number(),
  width: z.number(),
  src: z.string().url(),
});

const ajaxMediaSchema = ajaxImageSchema.extend({
  alt: z.string().nullable(),
  id: z.number(),
  position: z.number().min(1),
  media_type: z.string(),
});

const ajaxSellingPlanOptionSchema = z.object({
  name: z.string(),
  position: z.number(),
  value: z.string(),
});

const ajaxSellingPlanSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  options: z.array(ajaxSellingPlanOptionSchema),
  recurring_deliveries: z.boolean(),
});

const ajaxSellingPlanGroupOptionSchema = z.object({
  name: z.string(),
  position: z.number(),
  values: z.array(z.string()),
});

const ajaxSellingPlanGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  options: z.array(ajaxSellingPlanGroupOptionSchema),
  selling_plans: z.array(ajaxSellingPlanSchema),
});

/** https://shopify.dev/docs/api/ajax/reference/product#selling-plan-example */
const ajaxSellingPlanAllocationSchema = z.object({
  /** zero decimal */ price: z.number(),
  /** zero decimal */ compare_at_price: z.number(),
  /** zero decimal */ per_delivery_price: z.number(),
  selling_plan_id: z.number(),
  selling_plan_group_id: z.number(),
});
export type AjaxSellingPlanAllocation = z.infer<
  typeof ajaxSellingPlanAllocationSchema
>;

const ajaxProductOptionsSchema = z.object({
  name: z.string(),
  position: z.number(),
  values: z.array(z.string()),
});

const ajaxVariantSchema = z.object({
  id: z.number(),
  title: z.string(),
  option1: z.string().nullable(),
  option2: z.string().nullable(),
  option3: z.string().nullable(),
  inventory_management: z.string().nullable(),
  barcode: z.string().nullable(),
  sku: z.string(),
  requires_shipping: z.boolean(),
  taxable: z.boolean(),
  featured_image: z.string().nullable(),
  available: z.boolean(),
  name: z.string(),
  public_title: z.string().nullable(),
  options: z.array(z.string()),
  price: z.number(),
  quantity_rule: z.any(),
  quantity_price_breaks: z.array(z.any()),
  weight: z.number(),
  compare_at_price: z.number().nullable(),
  requires_selling_plan: z.boolean(),
  selling_plan_allocations: z.array(ajaxSellingPlanAllocationSchema),
});
export type AjaxProductVariant = z.infer<typeof ajaxVariantSchema>;

/** https://shopify.dev/docs/api/ajax/reference/product#response */
export const ajaxProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  handle: z.string(),
  description: z.string(),
  published_at: z.string().datetime(),
  created_at: z.string().datetime(),
  vendor: z.string(),
  type: z.string(),
  tags: z.array(z.string()),
  price: z.number(),
  price_min: z.number(),
  price_max: z.number(),
  price_varies: z.boolean(),
  compare_at_price: z.number().nullable(),
  compare_at_price_min: z.number(),
  compare_at_price_max: z.number(),
  compare_at_price_varies: z.boolean(),
  available: z.boolean(),
  images: z.array(z.string()),
  featured_image: z.string(),
  requires_selling_plan: z.boolean(),
  media: z.array(ajaxMediaSchema),
  options: z.array(ajaxProductOptionsSchema),
  variants: z.array(ajaxVariantSchema),
  selling_plan_groups: z.array(ajaxSellingPlanGroupSchema),
  url: z.string(),
});
export type AjaxProduct = z.infer<typeof ajaxProductSchema>;
