import { parseGid } from "@shopify/admin-graphql-api-utilities";
import type { Settings } from "./index.ts";
import { getCurrencyRebaseUtil } from "./forShopify.ts";
import type {
  MaybeAllocatedDetail,
  OffrEventDetail,
  OffrPricingEventDetail,
  SellingPlan,
  SellingPlanWithAllocation,
} from "./types.ts";

/** extract currency utils to be used in all these functions */
let rebase = (() => 0) as unknown as ReturnType<typeof getCurrencyRebaseUtil>;
let formatPrice = (() => "") as unknown as Intl.NumberFormat["format"];

/**
 * Creates an element for shopper to pick from selling plan options
 *
 * Example shown here
 * https://shopify.dev/docs/apps/build/purchase-options/subscriptions/selling-plans/build-a-selling-plan#selling-plan-api-properties
 *
 * sellingPlanGroup.options contains descriptions
 * https://community.shopify.dev/t/sellingplan-example-violates-spec/571
 *
 * @todo for theme / liquid:
 * https://shopify.dev/docs/storefronts/themes/pricing-payments/subscriptions/add-subscriptions-to-your-theme
 */

export function buildSellingPlanPicker(
  // allow SuccessResponse to aggressively show options to shopper
  detail: MaybeAllocatedDetail,
  settings: Settings
) {
  // type check because it is based on optional input type
  if (!detail.data.sellingPlanGroup.options)
    throw "sellingPlanGroup must have an options property but it is missing";

  // set currency utils
  rebase = getCurrencyRebaseUtil(settings.shopCurrency);
  formatPrice = new Intl.NumberFormat(settings.shopLocale, {
    style: "currency",
    currency: settings.shopCurrency,
  }).format;

  // create placeholder options for shopper
  const optGroups = detail.data.sellingPlanGroup.options.map((optionLabel) => {
    const optGroup = document.createElement("optgroup");
    optGroup.label = optionLabel;
    return optGroup;
  });
  const pricedOptGroups = optGroups.map(
    (optGroup) => optGroup.cloneNode() as HTMLOptGroupElement
  );

  // create options for shopper
  let weHavePricing = true;
  detail.data.sellingPlans.forEach((sellingPlan) => {
    sellingPlan.options?.forEach((optionName, i) => {
      const planId = parseGid(sellingPlan.id);
      optGroups[i].appendChild(new Option(optionName, planId));

      // maybe build pricedOption
      const { formattedPrice } = pricingFromSellingPlan(
        sellingPlan,
        i
        // detail.ajaxProduct
      );
      if (formattedPrice)
        pricedOptGroups[i].appendChild(
          new Option(`${optionName} (${formattedPrice})`, planId)
        );
      else weHavePricing = false;
    });
  });

  // build picker
  const picker = document.createElement("select");
  picker.name = "selling_plan";
  picker.setAttribute("form", settings.productFormId);
  picker.replaceChildren(...optGroups);

  // maybe build picker with pricing
  let pricedPicker = undefined as undefined | HTMLSelectElement;
  if (weHavePricing) {
    const picker = document.createElement("select");
    picker.name = "selling_plan";
    picker.setAttribute("form", settings.productFormId);
    picker.replaceChildren(...pricedOptGroups);
    pricedPicker = picker;
  }

  // add picker listeners
  const pickerListener = getPickerListener({ ...detail, customPicker: picker });
  picker.addEventListener("change", pickerListener);
  pickerListener(); // dispatch once to set initial price
  if (pricedPicker) {
    pricedPicker.addEventListener(
      "change",
      getPickerListener({ ...detail, customPicker: pricedPicker })
    );
  }

  return { picker, pricedPicker };
}

export function getPickerListener({
  //   ajaxProduct,
  data,
  customPicker,
}: Omit<
  Extract<OffrEventDetail, { type: "success" | "allocated" }>,
  "picker" | "pricedPicker"
> & {
  /**
   * any picker with the condition:
   * values are the sellingPlan numeric ID
   * Uses OptGroups to segment pricing policies
   */
  customPicker: HTMLSelectElement;
}) {
  return () => {
    // this is needed to determine which plan pricing policy to use
    const optGroupIndex = indexOfSelectedOptGroup(customPicker);
    // get the pricing (preferably from the allocation)
    const sellingPlan = data.sellingPlans.find(
      (plan) => parseGid(plan.id) === customPicker.value
    );
    if (!sellingPlan) throw "unable to locate selling plan";
    const pricing = pricingFromSellingPlan(
      sellingPlan,
      optGroupIndex
      //   ajaxProduct
    );
    // announce the pricing
    document.dispatchEvent(
      new CustomEvent<OffrPricingEventDetail>("offr", {
        detail: { type: "pricing", ...pricing },
      })
    );
  };
}

/** calculate the index of the pricing policy for the first selection */
function indexOfSelectedOptGroup(selectElement: HTMLSelectElement) {
  const optGroup = selectElement.selectedOptions[0].parentElement;
  if (!optGroup) throw "nothing selected";
  if (!(optGroup instanceof HTMLOptGroupElement))
    throw "the select list has no optGroup";
  const optGroups = optGroup.parentElement?.childNodes;
  if (!optGroups) throw "invalid select element";
  return Array.from(optGroups).indexOf(optGroup);
}

/** Extract usable pricing information from a selling plan */
function pricingFromSellingPlan(
  sellingPlan: SellingPlanWithAllocation | SellingPlan,
  pricingPolicyIndex: number
  //   ajaxProduct: MaybeAllocatedDetail["ajaxProduct"]
) {
  const pricingPolicy = sellingPlan.pricingPolicies?.[pricingPolicyIndex];
  if (!pricingPolicy)
    throw {
      message: `Missing pricing policy at index ${pricingPolicyIndex}`,
      sellingPlan,
    };
  const result =
    "allocation" in sellingPlan
      ? pricingFromAllocation(sellingPlan.allocation)
      : pricingFromPricingPolicy(pricingPolicy);
  type Pricing = Partial<Exclude<typeof result, undefined>> & {
    pricingPolicy: typeof pricingPolicy;
  };
  return result
    ? ({ pricingPolicy, ...result } as Pricing)
    : ({ pricingPolicy } as Pricing);
}
export type Pricing = ReturnType<typeof pricingFromSellingPlan>;

function pricingFromAllocation(
  allocation: SellingPlanWithAllocation["allocation"]
) {
  return pricingFromZeroDecimal(allocation.price);
}

/**
 * @todo calculate price from other types of pricing policies
 */
function pricingFromPricingPolicy(
  pricingPolicy: Exclude<
    SellingPlan["pricingPolicies"],
    null | undefined
  >[number]
  //   ajaxProduct: MaybeAllocatedDetail["ajaxProduct"]
) {
  const zeroDecimal =
    pricingPolicy?.fixed?.adjustmentType === "PRICE" &&
    pricingPolicy.fixed.adjustmentValue?.fixedValue
      ? rebase(+pricingPolicy.fixed.adjustmentValue.fixedValue, "toZeroDecimal")
      : undefined;
  return zeroDecimal ? pricingFromZeroDecimal(zeroDecimal) : undefined;
}

function pricingFromZeroDecimal(zeroDecimalPrice: number) {
  const numericPrice = rebase(zeroDecimalPrice, "fromZeroDecimal");
  return {
    zeroDecimalPrice,
    formattedPrice: formatPrice(numericPrice),
    numericPrice,
  };
}
