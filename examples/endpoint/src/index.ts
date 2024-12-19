import { handleCalculation } from "./example.ts";
import { type ErrorBody } from "../../../lib/common/offr.ts";

/**
 * This is the HTTP entry point.
 * https://docs.deno.com/api/deno/~/Deno.serve
 */
Deno.serve(async (req) => {
  // basic auth: disallow any requests that don't have the key as the path
  if (new URL(req.url).pathname != `/${Deno.env.get("KEY")}`)
    return new Response(null, { status: 401 });
  try {
    return await successHandler(req);
  } catch (error) {
    return errorHandler(error);
  }
});

/** returns the success json response */
const successHandler = async (req: Request) => {
  /**
   * the shopper input
   * https://developer.mozilla.org/en-US/docs/Web/API/FormData
   */
  const formData = await req.formData();

  const response = handleCalculation(formData);

  // log for development; probably remove these for production
  console.dir(req, { depth: Infinity });
  console.dir(formData, { depth: Infinity });
  console.dir(response, { depth: Infinity });

  return jsonResponse(response);
};

/** returns a standardized error json response */
// deno-lint-ignore no-explicit-any
const errorHandler = (error: any) => {
  console.warn(error);

  return jsonResponse({
    success: false,
    publicMessage: "Oops. We couldn't process your request.",
    privateError: error ?? "",
  } satisfies ErrorBody);
};

/** simple response JSON wrapper */
// deno-lint-ignore no-explicit-any
const jsonResponse = (json: any) => {
  return new Response(JSON.stringify(json), {
    headers: { "Content-Type": "application/json" },
  });
};
