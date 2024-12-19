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
