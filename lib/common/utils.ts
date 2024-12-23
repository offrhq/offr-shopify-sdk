/**
 * Provides the queried element.
 * If not found, it throws with a helpful message
 */
export const requireEl = <T extends Element>(el: ParentNode, query: string) => {
  const result = el.querySelector<T>(query);
  if (!result)
    throw `Couldn't find ${query}. Update your query or remove code depending on this element.`;
  return result;
};

/** Create an HTML Element from a string */
export function elementFromString<T extends HTMLElement>(html: string) {
  const template = document.createElement("template");
  template.innerHTML = html;
  if (!template.content.firstChild) throw "error creating element";
  return template.content.firstChild as T;
}
