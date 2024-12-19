import { type HtmlFormControlElement } from "./elements.ts";

let _inputs: HtmlFormControlElement[] | undefined = undefined;

const dispatchOffrChangeEvent = () =>
  document.dispatchEvent(
    new CustomEvent("offr", { detail: { type: "change" } })
  );

/**
 * monitor for changes on all product-form related inputs
 * for example, quantity changes, custom offr input changes, etc
 * and dispatch our own event.
 *
 * user can add a single listener:
 * `document.addEventListener('offr-change', ...);`
 */
export const listenForChangesOn = (inputs: HtmlFormControlElement[]) => {
  if (_inputs) {
    _inputs.forEach((el) =>
      el.removeEventListener("change", dispatchOffrChangeEvent)
    );
  }

  _inputs = inputs;

  _inputs.forEach((el) => {
    el.addEventListener("change", dispatchOffrChangeEvent);
  });
};
