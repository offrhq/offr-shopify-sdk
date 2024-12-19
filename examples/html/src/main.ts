// TYPES ONLY. Avoid coupled code and bloat:
// DO NOT import values provided by appBlockScript
import type {
  OffrEventDetail,
  Settings,
} from "../../../lib/appBlockScript/src/index.ts";
import { requireEl } from "../../../lib/common/utils.ts";

// elements set in our Offr HTML
/** To show status / errors / warnings */
const offrInfoElement = requireEl<HTMLElement>(document, "#offrInfo");
/** To show the price of the buyer's selection */
const offrPriceElement = requireEl<HTMLElement>(document, "#offrPrice");
/** To show a dropdown for shopper to select a plan option */
const offrPickerElement = requireEl<HTMLElement>(document, "#offrPicker");

// core info expected from Offr init
/** The core product form Shopify uses for add-to-cart */
let productForm: HTMLFormElement;
let settings: Settings;
let utils: ReturnType<
  (OffrEventDetail & { type: "init" })["offrSetup"]
>["utils"];

// debounce
/** https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#return_value */
let timeout: number;
/** defer network calls to avoid unwanted delays  */
const debounceCalculate = () => {
  clearTimeout(timeout); // cancel any previous queued calls
  timeout = setTimeout(() => {
    if (!productForm.reportValidity()) return; // block bad calls
    utils.disableElements(settings.controls.offrInputs);
    utils.disableElements(settings.controls.themeInputs);
    utils.disableElements(settings.controls.buyButtons);
    const formData = new FormData(productForm);
    utils.calculate(formData); // no await; will dispatch event on response
    offrInfoElement.innerHTML = "Checking price...";
    clearTimeout(timeout);
  }, 1000);
};

// handle any/all Offr events
document.addEventListener("offr", (e) => {
  if (e.detail.type === "init") {
    const { productForm, productFormId, productVariantInputElement } =
      e.detail.settings;
    if (!(productForm && productFormId && productVariantInputElement))
      throw `unable to locate required element(s). create a valid querySelector ${JSON.stringify(
        { productForm, productFormId, productVariantInputElement }
      )}`;

    settings = {
      ...e.detail.settings,
      productForm,
      productFormId,
      productVariantInputElement,
    } satisfies Settings;

    utils = e.detail.offrSetup(settings).utils;
    utils.disableElements(settings.controls.buyButtons);
    // attach our custom inputs to the product form
    for (const node of settings.offrInputElements)
      node.setAttribute("form", settings.productFormId);
    utils.listenForChangesOn([
      // listen to offr controls (ex: size)
      ...settings.controls.offrInputs,
      // listen to theme controls (ex: quantity)
      ...settings.controls.themeInputs,
    ]);
  }
  if (e.detail.type === "change") {
    offrInfoElement.innerHTML = "Customizing";
    offrPriceElement.innerHTML = "";
    utils.clearCustomAttributes();
    offrPickerElement.innerHTML = "";
    debounceCalculate();
  }
  if (e.detail.type === "response") {
    offrInfoElement.innerHTML = "";
  }
  if (e.detail.type === "success") {
    offrInfoElement.innerHTML =
      "It will be a few more moments until the add-to-cart buttons are activated. This can take 30 seconds or more.";

    // enable picker for shopper selection
    offrPickerElement.replaceChildren(e.detail.pricedPicker ?? e.detail.picker);

    // add the custom attributes to show in cart
    e.detail.data.customAttributes.forEach((attribute) =>
      utils.addCustomAttribute(...attribute)
    );
  }
  if (e.detail.type === "allocated") {
    offrInfoElement.innerHTML = "";

    // enable picker for shopper selection
    // provided pickers dispatch Offr 'pricing' event
    offrPickerElement.replaceChildren(e.detail.pricedPicker ?? e.detail.picker);

    // add the custom attributes to show in cart
    e.detail.data.customAttributes.forEach((attribute) =>
      utils.addCustomAttribute(...attribute)
    );

    // enable customization inputs
    // don't enable earlier (otherwise could have a race condition)
    utils.enableElements(settings.controls.offrInputs);
    utils.enableElements(settings.controls.themeInputs);
    utils.enableElements(settings.controls.buyButtons);
  }
  if (e.detail.type === "pricing" && e.detail.formattedPrice) {
    offrPriceElement.innerHTML = e.detail.formattedPrice;
  }
  if (e.detail.type === "error") {
    offrInfoElement.innerHTML = e.detail.error.message;
    console.warn(e.detail);
    utils.enableElements(settings.controls.offrInputs);
    utils.enableElements(settings.controls.themeInputs);
  }
});

declare global {
  interface DocumentEventMap {
    offr: CustomEvent<OffrEventDetail>;
  }
}
