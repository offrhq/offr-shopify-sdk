import { decode } from "jsr:@decode-formdata/decode-formdata@0.8.0";
import * as v from "jsr:@valibot/valibot@0.42.1";

/**
 * We use [Valibot](https://valibot.dev/) to enforce expected data.
 * In our example, we are calculating pricing of an "example fish tank".
 *
 * We could choose impose various restrictions.
 * For example, we could:
 * * restrict numbers to increments of .125
 * * put a max length for each side
 * * put a total volume limitation
 * * etc.
 */

/** Natural Number (ie a positive integer excluding infinity) */
const natNum = v.pipe(v.number(), v.integer(), v.minValue(1), v.finite());

/** data expected from the shop's theme */
const themeSchema = v.object({
  quantity: natNum,
});

/** data extracted from request headers */
const headerSchema = v.object({
  productId: natNum,
  variantId: natNum,
});

/** the data expected in the form payload */
const formDataSchema = v.object({
  ...themeSchema.entries,
  lengthInches: v.pipe(v.number(), v.minValue(0), v.finite()),
  widthInches: v.pipe(v.number(), v.minValue(0), v.finite()),
  heightInches: v.pipe(v.number(), v.minValue(0), v.finite()),
});

/** the combined data expected for calculations */
const inputSchema = v.object({
  ...formDataSchema.entries,
  ...headerSchema.entries,
});
export type Input = v.InferOutput<typeof inputSchema>;

/** extracts the data we expect from the headers */
const parseHeaders = (req: Request) => {
  const productId = req.headers.get("product-id");
  const variantId = req.headers.get("variant-id");
  return {
    productId: productId ? +productId : null,
    variantId: variantId ? +variantId : null,
  };
};

/**
 * extracts the data we expect from the FormData payload
 *
 * `decode` converts FormData to an object with the prescribed primitives
 * https://github.com/fabian-hiller/decode-formdata
 */
const parseFormData = (formData: FormData) => {
  return decode(formData, {
    numbers: ["quantity", "lengthInches", "widthInches", "heightInches"],
  });
};

/** Translate formData into expected schema or provide error */
export const parseRequest = async (req: Request) => {
  return v.safeParse(inputSchema, {
    ...parseFormData(await req.formData()),
    ...parseHeaders(req),
  });
};
