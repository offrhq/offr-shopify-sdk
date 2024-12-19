/**
 * A control / input that a user can interact with.
 * @see {HTMLFormControlsCollection}
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/elements#value
 */
export type HtmlFormControlElement =
  | HTMLButtonElement
  | HTMLFieldSetElement
  | HTMLInputElement
  | HTMLObjectElement
  | HTMLOutputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

/**
 * Returns all form control elements for any element
 * (i.e. for input living outside the form tag)
 *
 * https://stackoverflow.com/questions/12862601/how-an-i-get-all-form-elements-input-textarea-select-with-jquery/76149181#76149181
 */
export function getChildInputElements(element: HTMLElement) {
  const elements = element.querySelectorAll<HtmlFormControlElement>(
    ":where(button,fieldset,input,object,output,select,textarea)"
  );
  return elements;
}

/**
 * Finds all elements that point to a form
 * ex: `<input form="abc" />
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#form
 *
 * An input form attribute lets you place an input anywhere in the document
 * and have it included with a form elsewhere in the document.
 *
 * @note form.id doesn't work
 */
export function getAttributedInputElements(form: HTMLFormElement) {
  const elements = document.querySelectorAll<HtmlFormControlElement>(
    `[form="${form.getAttribute("id")}"]`
  );
  return elements;
}

export function elementFromString(html: string) {
  const template = document.createElement("template");
  template.innerHTML = html;
  if (!template.content.firstChild) throw "error creating element";
  return template.content.firstChild;
}
