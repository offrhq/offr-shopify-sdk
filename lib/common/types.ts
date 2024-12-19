/** reflects possible json */
export type Json = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject {
  [key: string]: Json;
}
interface JsonArray extends Array<Json> {}

/** disallow null | undefined top level properties */
export type NonNullableObject<T> = {
  [K in keyof T]: NonNullable<T[K]>;
};
type NonNullable<T> = Exclude<T, null | undefined>;
