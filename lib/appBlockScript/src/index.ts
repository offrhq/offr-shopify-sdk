// adding zod and schema adds ~300kb to script; instead use type
import { parseGid } from "@shopify/admin-graphql-api-utilities";
import { elementFromString, type HtmlFormControlElement } from "./elements.ts";
import { buildSellingPlanPicker, getPickerListener } from "./picker.ts";
import { getOffrBlockData } from "./forOffr.ts";
import {
  getShopCurrency,
  getProductDetails,
  getShopLocale,
  pollForSellingPlanAllocation,
  fetchProduct,
} from "./forShopify.ts";
import type {
  SuccessResponse,
  ErrorResponse,
  OffrSuccessEventDetail,
  OffrAllocationsEventDetail,
  OffrResponseEventDetail,
  OffrErrorEventDetail,
  OffrEventDetail,
} from "./types.ts";
import { listenForChangesOn } from "./inputListener.ts";
import type { NonNullableObject } from "../../common/types.ts";
import { windowShopify } from "./forShopify.ts";

// declare custom event(s) we can dispatch
declare global {
  interface GlobalEventHandlersEventMap {
    offr: CustomEvent<OffrEventDetail>;
  }
}

/** see deno.jsonc */
declare const __PUBLIC_SHOPIFY_APP_HANDLE__: string;
//eslint-disable-next-line
const APP_HANDLE = `${__PUBLIC_SHOPIFY_APP_HANDLE__}`;

const offrBlockData = getOffrBlockData();
let _settings = {
  ...offrBlockData,
  ...getProductDetails(offrBlockData),
  /**
   * https://shopify.dev/docs/apps/online-store/app-proxies#add-an-app-proxy
   * The handle is `offr` / `offr-dev` / similar
   */
  appProxyUrl: `${windowShopify.routes.root}apps/${APP_HANDLE}` as const,
  /** the shop language and country */
  shopLocale: getShopLocale(),
  /** the shop's financial currency */
  shopCurrency: getShopCurrency(),
};
/** The information Offr requires to operate */
export type Settings = NonNullableObject<typeof _settings>;

const getUtils = (settings: Settings) => {
  return {
    /** disables all input elements in the list */
    disableElements: (list: Set<HtmlFormControlElement>) =>
      list.forEach((el) => el.setAttribute("disabled", "")),

    /** disables all input elements in the list */
    enableElements: (list: Set<HtmlFormControlElement>) =>
      list.forEach((el) => el.removeAttribute("disabled")),

    /**
     * adds an hidden input containing custom attributes for the item.
     *
     * Shopify AJAX api calls these "line item properties"
     * https://shopify.dev/docs/api/ajax/reference/cart#add-line-item-properties
     *
     * The following structure work with Shopify's native behavior
     * https://shopify.dev/docs/storefronts/themes/architecture/templates/product#line-item-properties
     */
    addCustomAttribute: (key: string, value: string) =>
      settings.customAttributesElement.appendChild(
        elementFromString(
          `<input type="hidden" name="properties[${key}]" value="${value}" form="${settings.productFormId}" />`
        )
      ),

    /**  remove all custom attributes for the item  */
    clearCustomAttributes: () =>
      (settings.customAttributesElement.innerHTML = ""),

    /** dispatches an offr change event if any of the inputs are changed */
    listenForChangesOn,

    /** emits an event with pricing calculations on shopper selection */
    getPickerListener,

    /**
     * Use the formula to calculate the price of the custom product.
     *
     * Reminder: formData only includes associated fields:
     * * product form children
     * * external input fields with the `form="<FORM_ID_HERE>"` attribute
     *
     * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#form
     */
    calculate: async (formData: FormData) => {
      const response = await fetch(settings.appProxyUrl, {
        method: "POST",
        body: formData,
        headers: {
          "ngrok-skip-browser-warning": "true",
          "product-id": `${settings.productId}`,
          "variant-id": settings.productVariantInputElement.value,
        },
      });
      // safely get body json
      let json = {} as SuccessResponse | ErrorResponse;
      try {
        json = await response.json();
      } catch (e) {
        console.warn(e);
      }

      // raw response notification
      document.dispatchEvent(
        new CustomEvent<OffrResponseEventDetail>("offr", {
          detail: { type: "response", response, json },
        })
      );

      // success/error notification
      if (json?.success) {
        const ajaxProduct = await fetchProduct(settings.productDataUrl);
        // success
        const detail = {
          type: "success",
          data: json.data,
          ajaxProduct,
        } as const;
        document.dispatchEvent(
          new CustomEvent<OffrSuccessEventDetail>("offr", {
            detail: {
              ...detail,
              ...buildSellingPlanPicker(detail, settings),
            },
          })
        );

        // await allocations (needed for Shopify checkout)
        const allocations = await pollForSellingPlanAllocation({
          productDataUrl: settings.productDataUrl,
          sellingPlanIds: json.data.sellingPlans.map(
            (sellingPlan) => +parseGid(sellingPlan.id)
          ),
          variantId: +settings.productVariantInputElement.value,
        });
        // add allocation to each selling plan

        const sellingPlans = json.data.sellingPlans.map((sellingPlan, i) => ({
          ...sellingPlan,
          allocation: allocations[i],
        }));
        const data = { ...json.data, sellingPlans };

        document.dispatchEvent(
          new CustomEvent<OffrAllocationsEventDetail>("offr", {
            detail: {
              type: "allocated",
              allocations: allocations,
              data,
              ajaxProduct,
              ...buildSellingPlanPicker(
                { type: "allocated", data, ajaxProduct },
                settings
              ),
            },
          })
        );
      }
      // received a formatted error
      else if (json.success === false) {
        document.dispatchEvent(
          new CustomEvent<OffrErrorEventDetail>("offr", {
            detail: { type: "error", error: json },
          })
        );
      }
      // deal with all other errors
      else {
        const message =
          response.status === 404
            ? // shopify gives 404 on connection fail
              `Oops. We couldn't connect to the app proxy. Please try again in a few minutes.`
            : response.status >= 400 && response.status < 500
            ? // 400s error codes
              `Oops. It looks like there is something wrong with your submission.`
            : // 500s error codes
              `Oops. We're having a little trouble right now. Please try again in a few minutes.`;
        document.dispatchEvent(
          new CustomEvent<OffrErrorEventDetail>("offr", {
            detail: { type: "error", error: { success: false, message } },
          })
        );
      }
    },
  };
};

// create a temporary file to record type
const _initDetail = {
  type: "init" as const,
  settings: _settings,
  offrSetup: (settings: Settings) => {
    _settings = settings; // save settings locally
    return { utils: getUtils(settings) };
  },
};
// save to global for those who may miss the event
initDetail = _initDetail;
document.dispatchEvent(
  new CustomEvent<OffrInitEventDetail>("offr", { detail: initDetail })
);

export type OffrInitEventDetail = typeof _initDetail;
// deno-lint-ignore no-var
declare var initDetail: OffrInitEventDetail;
