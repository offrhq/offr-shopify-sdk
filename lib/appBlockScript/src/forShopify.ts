import {
  getAttributedInputElements,
  getChildInputElements,
} from "./elements.ts";
import { type OffrBlockData } from "./forOffr.ts";
import type {
  AjaxProduct,
  AjaxProductVariant,
  AjaxSellingPlanAllocation,
} from "../../common/ajax.ts";
import type { WindowShopify } from "../../common/shopify.ts";
import { requireEl } from "../../common/utils.ts";

/**
 * The Shopify global variable in shopper's browser window
 * This is ONLY used in-browser
 */
// deno-lint-ignore no-window
export const windowShopify = window.Shopify;
declare global {
  interface Window {
    Shopify: WindowShopify;
  }
}

/**
 * Returns a function which can convert from zero decimal and to zero decimal
 * for any currency supported.
 *
 * https://shopify.dev/docs/api/ajax/reference/product
 * https://stripe.com/docs/currencies#zero-decimal
 */
export function getCurrencyRebaseUtil(currency: string) {
  function rebaseCurrency(
    price: number,
    transform: "toZeroDecimal" | "fromZeroDecimal"
  ) {
    const zeroDecimalCurrencies = [
      "BIF",
      "CLP",
      "DJF",
      "GNF",
      "JPY",
      "KMF",
      "KRW",
      "MGA",
      "PYG",
      "RWF",
      "UGX",
      "VND",
      "VUV",
      "XAF",
      "XOF",
      "XPF",
      // special cases; following assumed 0 decimals?
      "ISK",
      "HUF",
      "TWD",
      "UGX",
    ];

    const threeDecimalCurrencies = ["BHD", "JOD", "KWD", "OMR", "TND"];
    let base = 100; // default assumption
    if (zeroDecimalCurrencies.includes(currency)) base = 1;
    if (threeDecimalCurrencies.includes(currency)) base = 1000;
    return transform === "toZeroDecimal" ? price * base : price / base;
  }
  return rebaseCurrency;
}

/** Returns needed product inputs / product details */
export function getProductDetails(offrBlockData: OffrBlockData) {
  const { productForm, productFormId } = getProductFormElement();
  const productVariantInputElement = productForm
    ? getProductVariantInputElement(productForm)
    : undefined;

  const controls = {
    ...getThemeControlElements(),
    offrInputs: new Set(offrBlockData.offrInputElements),
  };

  return {
    /** the main product html form element for add-to-cart*/ productForm,
    /** the form's element id (if any) */ productFormId,
    /** the field with shopper's selection */ productVariantInputElement,
    /** input elements for the product form */
    controls,
    /** the endpoint for product queries */
    productDataUrl: getProductDataEndpoint(offrBlockData.productHandle),
  };
}

/**
 * finds the product form element (as created by typical shopify themes)
 * not all shopify themes will comply, so it is not required
 */
function getProductFormElement() {
  try {
    const productForm = requireEl<HTMLFormElement>(
      document,
      "product-form form"
    );
    const productFormId = productForm.getAttribute("id")!;
    return { productForm, productFormId };
  } catch (error) {
    console.warn(error);
    return { productForm: undefined, productFormId: undefined };
  }
}

/**
 * @type {HTMLInputElement} shopify advises this query selector
 * https://shopify.dev/docs/themes/pricing-payments/purchase-options/support-purchase-options#selling-plan-option-selection
 */
function getProductVariantInputElement(productFormElement: HTMLFormElement) {
  //  Essential to know the shopper's current choice
  return requireEl<HTMLInputElement>(productFormElement, 'input[name="id"]');
}

function getProductBuyButtonElements(productFormElement: HTMLFormElement) {
  const elements =
    productFormElement.querySelectorAll<HTMLButtonElement>(":where(button)");

  // essential to control ability to purchase
  if (!elements.length)
    console.warn("Offr couldn't locate product buy buttons");
  return elements;
}

function getProductQuantityElement() {
  try {
    return requireEl<HTMLElement>(document, "quantity-input");
  } catch (error) {
    console.warn(error);
    return null;
  }
}

function getThemeControlElements() {
  let { productForm } = getProductFormElement();
  productForm = productForm ?? document.createElement("form");

  const quantityElement =
    getProductQuantityElement() ?? document.createElement("template");
  const buyButtons = new Set(getProductBuyButtonElements(productForm));
  const themeInputs = new Set([
    ...getChildInputElements(quantityElement),
    ...getChildInputElements(productForm),
    ...getAttributedInputElements(productForm),
  ]);

  // separate buy buttons from other input fields
  buyButtons.forEach((btn) => themeInputs.delete(btn));

  return {
    /** buttons which add-to-cart or initiate checkout*/ buyButtons,
    /** input elements that customize the product */ themeInputs,
  };
}

/**
 * Shopify tends to take 10-30 seconds to take new plans live
 * checkout will not work properly until then.
 * No API; we must poll to determine when checkout is ready
 *
 * This function will remain in infinite loop
 * until all sellingPlanIds are publicly confirmed by Shopify
 *
 * Poll shopify via AJAX Product API
 * https://shopify.dev/docs/api/ajax/reference/product
 */
export async function pollForSellingPlanAllocation({
  productDataUrl,
  sellingPlanIds,
  variantId,
}: {
  productDataUrl: string;
  variantId: number;
  sellingPlanIds: AjaxSellingPlanAllocation["selling_plan_id"][];
}) {
  let sellingPlanAllocations: AjaxSellingPlanAllocation[] = [];
  while (sellingPlanAllocations.length < sellingPlanIds.length) {
    const ajaxProduct = await fetchProduct(productDataUrl);
    const ajaxProductVariant = variantFromProduct(ajaxProduct, variantId);
    if (!ajaxProductVariant) throw "variant does not exist on this product";
    const maybeAllocations: AjaxSellingPlanAllocation[] = [];
    if (
      // abandon the iteration if any allocations are missing
      sellingPlanIds.some((sellingPlanId) => {
        const allocation = allocationFromProductVariant(
          ajaxProductVariant,
          sellingPlanId
        );
        !!allocation && maybeAllocations.push(allocation);
        return allocation === undefined;
      })
    ) {
      // poll every 3 seconds (if the allocation is undefined)
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } else {
      // we found all allocations, so we save them
      sellingPlanAllocations = maybeAllocations;
    }
  }
  return sellingPlanAllocations;
}

export function variantFromProduct(
  ajaxProduct: AjaxProduct,
  variantId: AjaxProductVariant["id"]
) {
  return ajaxProduct.variants.find((variant) => variant.id === variantId);
}

export function allocationFromProductVariant(
  ajaxProductVariant: AjaxProductVariant,
  sellingPlanId: AjaxSellingPlanAllocation["selling_plan_id"]
) {
  return (ajaxProductVariant.selling_plan_allocations ?? []).find(
    (allocation) => allocation.selling_plan_id === sellingPlanId
  );
}

/**
 * Returns the public Shopify data endpoint for the product
 *
 * Shopify has both .js and .json which have some slight differences
 */
function getProductDataEndpoint(productHandle: string) {
  return `${windowShopify.routes.root}products/${productHandle}.js` as const;
}

/**
 * Provides a browser compliant locale
 *
 * * Shopify mislabels language as locale.
 * * Browser locale expects language AND dialect/country
 * * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locales_argument
 */
export function getShopLocale() {
  return windowShopify.locale + "-" + windowShopify.country;
}

export function getShopCurrency() {
  return windowShopify.currency.active;
}

export async function fetchProduct(productEndpoint: string) {
  const res = await fetch(productEndpoint);
  const product: AjaxProduct = await res.json();
  return product;
}
