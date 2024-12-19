import type { AppResponseBody } from "../../common/offr.ts";
import type {
  AjaxProduct,
  AjaxSellingPlanAllocation,
} from "../../common/ajax.ts";
import type { fetchProduct } from "./forShopify.ts";
import type { buildSellingPlanPicker, Pricing } from "./picker.ts";
import { Json } from "../../common/types.ts";
import { OffrInitEventDetail } from "./index.ts";

// Types derived from AppBridgeResponse
export type SuccessResponse = Extract<AppResponseBody, { success: true }>;
export type ErrorResponse = Extract<AppResponseBody, { success: false }>;
export type SellingPlan = SuccessResponse["data"]["sellingPlans"][number];

export type SellingPlanWithAllocation = SellingPlan & {
  allocation: AjaxSellingPlanAllocation;
};

export type AllocatedSuccessData = Omit<
  SuccessResponse["data"],
  "sellingPlans"
> & {
  sellingPlans: SellingPlanWithAllocation[];
};

export type MaybeAllocatedDetail = (
  | {
      type: "success";
      data: SuccessResponse["data"];
    }
  | { type: "allocated"; data: AllocatedSuccessData }
) & { ajaxProduct: AjaxProduct };

// Offr Custom Event .detail Types
export type OffrResponseEventDetail = { type: "response" } & {
  response: Response;
  json: Json;
};

export type OffrPricingEventDetail = {
  type: "pricing";
} & Pricing;

export type OffrErrorEventDetail = { type: "error" } & {
  error: ErrorResponse;
};

export type OffrSuccessEventDetail = { type: "success" } & {
  data: SuccessResponse["data"];
  ajaxProduct: Awaited<ReturnType<typeof fetchProduct>>;
} & ReturnType<typeof buildSellingPlanPicker>;

export type OffrAllocationsEventDetail = { type: "allocated" } & {
  /** raw allocations */
  allocations: AjaxSellingPlanAllocation[];
  data: AllocatedSuccessData;
  ajaxProduct: Awaited<ReturnType<typeof fetchProduct>>;
} & ReturnType<typeof buildSellingPlanPicker>;

export type OffrChangeEventDetail = { type: "change" } & {
  utils: ReturnType<OffrInitEventDetail["offrSetup"]>["utils"];
  settings: OffrInitEventDetail["settings"];
};

export type OffrEventDetail =
  | OffrInitEventDetail
  | OffrChangeEventDetail
  | OffrResponseEventDetail
  | OffrSuccessEventDetail
  | OffrAllocationsEventDetail
  | OffrPricingEventDetail
  | OffrErrorEventDetail;
