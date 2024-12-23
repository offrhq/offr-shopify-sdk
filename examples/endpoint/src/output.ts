import { SuccessBody, SuccessData } from "../../../lib/common/offr.ts";
import { SellingPlanInput } from "../../../lib/common/gql/admin.2024-07.graphql.ts";
import { Input } from "./input.ts";

export const getPlanEntries = (input: Input) => {
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
              input.lengthInches * input.widthInches * input.heightInches * 0.02
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
              input.lengthInches *
                input.widthInches *
                input.heightInches *
                0.021
            ).toFixed(2)}`,
          },
        },
      },
    ],
  } satisfies SellingPlanInput;
  return [
    ["Acrylic", acrylicTank],
    ["Glass", glassTank],
  ] as const;
};

export const getSuccessBody = (
  input: Input,
  planEntries: ReturnType<typeof getPlanEntries>
) => {
  const data = {
    sellingPlanGroupInput: {
      sellingPlansToCreate: planEntries.map(([_, entry]) => entry),
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
        `${input.lengthInches}x${input.widthInches}x${input.heightInches}`,
      ],
    ],
  } as const satisfies SuccessData;
  return { success: true, data } satisfies SuccessBody;
};
