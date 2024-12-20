import { z } from "npm:zod@3.23.8";
import { calculationSuccessBodySchema } from "../../../lib/common/offr.ts";
import type { SellingPlanInput } from "../../../lib/common/gql/admin.2024-07.graphql.ts";

/**
 * We use [Zod](https://zod.dev/) to enforce a schema of the data we expect.
 * In our example, we are calculating pricing of an "example fish tank".
 *
 * We could choose impose additional restrictions.
 * For example, we could:
 * * restrict numbers to increments of .125
 * * put a max length for each side
 * * put a total volume limitation
 * * etc.
 */
export const measurementsSchema = z.object({
  lengthInches: z.coerce.number().positive(),
  widthInches: z.coerce.number().positive(),
  heightInches: z.coerce.number().positive(),
});

export const handleCalculation = (formData: FormData) => {
  const measurements = measurementsSchema.parse({
    lengthInches: formData.get("lengthInches"),
    widthInches: formData.get("widthInches"),
    heightInches: formData.get("heightInches"),
  });

  const acrylicTank = {
    name: "Acrylic Fish Tank",
    options: ["Acrylic"],
    category: "OTHER",
    inventoryPolicy: { reserve: "ON_FULFILLMENT" },
    billingPolicy: {
      fixed: {
        checkoutCharge: { type: "PERCENTAGE", value: { percentage: 100 } },
        remainingBalanceChargeTrigger: "NO_REMAINING_BALANCE",
      },
    },
    deliveryPolicy: { fixed: { fulfillmentTrigger: "ASAP" } },
    pricingPolicies: [
      {
        fixed: {
          adjustmentType: "PRICE",
          adjustmentValue: {
            fixedValue: `${(
              20.33 +
              measurements.lengthInches *
                measurements.widthInches *
                measurements.heightInches *
                0.02
            ).toFixed(2)}`,
          },
        },
      },
    ],
  } satisfies SellingPlanInput;

  const glassTank = {
    name: "Glass Fish Tank",
    options: ["Glass"],
    category: "OTHER",
    inventoryPolicy: { reserve: "ON_FULFILLMENT" },
    billingPolicy: {
      fixed: {
        checkoutCharge: { type: "PERCENTAGE", value: { percentage: 100 } },
        remainingBalanceChargeTrigger: "NO_REMAINING_BALANCE",
      },
    },
    deliveryPolicy: { fixed: { fulfillmentTrigger: "ASAP" } },
    pricingPolicies: [
      {
        fixed: {
          adjustmentType: "PRICE",
          adjustmentValue: {
            fixedValue: `${(
              25.33 +
              measurements.lengthInches *
                measurements.widthInches *
                measurements.heightInches *
                0.021
            ).toFixed(2)}`,
          },
        },
      },
    ],
  } satisfies SellingPlanInput;

  const data = {
    sellingPlanGroupInput: {
      sellingPlansToCreate: [acrylicTank, glassTank],
      name: "Custom Sized Fish Tank",
      options: ["Material"],
    },
    validFrom: new Date().toISOString(),
    validUntil: new Date(
      new Date().valueOf() + 3 * 60 * 60 * 1000 // 3 hours
    ).toISOString(),
    customAttributes: [
      [
        "Inches (LxWxH)",
        `${measurements.lengthInches}x${measurements.widthInches}x${measurements.heightInches}`,
      ],
    ],
  } satisfies SuccessBody["data"];

  return { success: true, data } satisfies SuccessBody;
};

type SuccessBody = z.infer<typeof calculationSuccessBodySchema>;
