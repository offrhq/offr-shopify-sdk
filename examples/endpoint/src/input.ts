import {
  decode,
  FormDataInfo,
} from "jsr:@decode-formdata/decode-formdata@0.8.0";
import * as v from "jsr:@valibot/valibot@0.42.1";

/**
 * Converts FormData to an object with the prescribed primitives
 * https://github.com/fabian-hiller/decode-formdata
 */
const formDataInfo = {
  numbers: ["quantity", "lengthInches", "widthInches", "heightInches"],
} satisfies FormDataInfo;

/** data expected from the shop's theme*/
const themeSchema = v.object({
  quantity: v.pipe(v.number(), v.integer(), v.minValue(1), v.finite()),
});

/**
 * We use [Valibot](https://valibot.dev/) to enforce expected data.
 * In our example, we are calculating pricing of an "example fish tank".
 *
 * We could choose impose additional restrictions.
 * For example, we could:
 * * restrict numbers to increments of .125
 * * put a max length for each side
 * * put a total volume limitation
 * * etc.
 */
export const inputSchema = v.object({
  ...themeSchema.entries,
  lengthInches: v.pipe(v.number(), v.minValue(0), v.finite()),
  widthInches: v.pipe(v.number(), v.minValue(0), v.finite()),
  heightInches: v.pipe(v.number(), v.minValue(0), v.finite()),
});
export type Input = v.InferOutput<typeof inputSchema>;

/** Translate formData into expected schema or provide error */
export const parseFormData = (formData: FormData) => {
  const formValues = decode(formData, formDataInfo);
  return v.safeParse(inputSchema, formValues);
};
