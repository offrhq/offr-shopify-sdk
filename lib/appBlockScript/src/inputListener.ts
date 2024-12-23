import { type HtmlFormControlElement } from "./elements.ts";
import { OffrStaleEventDetail } from "./types.ts";

let _inputs: HtmlFormControlElement[] | undefined = undefined;

const dispatchOffrStaleEvent = () => {
  document.dispatchEvent(
    new CustomEvent<OffrStaleEventDetail>("offr", { detail: { type: "stale" } })
  );
};

/**
 * monitor for changes on all product-form related inputs
 * for example, quantity changes, custom offr input changes, etc
 * and dispatch our own event.
 *
 * user can add a single listener for `offr` custom events
 *
 * `document.addEventListener('offr', ...);`
 */
export const listenForChangesOn = (inputs: HtmlFormControlElement[]) => {
  // remove existing listeners
  if (_inputs) {
    _inputs.forEach((el) => {
      el.removeEventListener("keydown", dispatchOffrStaleEvent);
      el.removeEventListener("change", dispatchOffrStaleEvent);
    });
  }

  // add listeners
  _inputs = inputs;
  _inputs.forEach((el) => {
    el.addEventListener("keydown", dispatchOffrStaleEvent);
    el.addEventListener("change", dispatchOffrStaleEvent);
  });
};
