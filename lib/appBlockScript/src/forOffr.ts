import { requireEl } from "../../common/utils.ts";
import { getChildInputElements } from "./elements.ts";

/** added by Offr app block and accessible as declared here */
// deno-lint-ignore no-var
declare var offrProductData: {
  /**
   * The numeric id of the product the shopper is viewing
   * ex: `1234567`
   */
  productId: number;
  /**
   * the handle for the product the shopper is viewing
   * ex: `example-fish-tank`
   */
  productHandle: string;
};

/** Offr's block element */
export function getOffrBlockData() {
  const offrElement = requireEl<HTMLElement>(document, "#offrWrapper");
  const offrInputElements = getChildInputElements(offrElement);
  const customAttributesElement = requireEl<HTMLElement>(
    offrElement,
    "#offrCustomAttributes"
  );
  return {
    /** the element for the offr app-block **/
    offrElement,
    /** all input elements injected in the offr*/
    offrInputElements,
    /** the line item fields for the add-to-cart line items */
    customAttributesElement,

    ...offrProductData,
  };
}

/** Guaranteed data from the Offr App Block */
export type OffrBlockData = ReturnType<typeof getOffrBlockData>;
