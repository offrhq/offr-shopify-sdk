import { ApiVersion } from "npm:@shopify/shopify-api@11.6.1";
import { codegen } from "npm:@graphql-codegen/core@4.0.2";
import { printSchema, parse } from "npm:graphql@16.9.0";
import { loadSchemaSync } from "npm:@graphql-tools/load@8.0.3";
import { JsonFileLoader } from "npm:@graphql-tools/json-file-loader@8.0.2";
import * as typescriptPlugin from "npm:@graphql-codegen/typescript@4.0.9";
import * as validationPlugin from "npm:graphql-codegen-typescript-validation-schema@0.16.0";
import { select } from "npm:@inquirer/prompts@7.2.0";

/** the current Shopify version */
const apiVersion = `${await select({
  message: "Which version of Shopify GraphQL?",
  choices: Object.values(ApiVersion).map((value) => ({ value })),
})}` as const;

const gqlSchema = parse(
  printSchema(
    loadSchemaSync(
      `./introspectionJson/admin.${apiVersion}.graphql.schema.json`,
      { loaders: [new JsonFileLoader()] }
    )
  )
);

const scalars = {
  ID: "string",
  String: "string",
  Boolean: "boolean",
  Int: "number",
  BigInt: "number",
  Float: "number",
  Color: "string",
  // https://shopify.dev/docs/api/admin-graphql/2024-07/scalars/ARN
  ARN: "string",
  Date: "string",
  DateTime: "string",
  Decimal: "string",
  FormattedString: "string",
  HTML: "string",
  JSON: { input: "string", output: "Json" },
  Money: "string",
  StorefrontID: "string",
  URL: "string",
  UnsignedInt64: "string",
  UtcOffset: "string",
};

const outputFile = `./admin.${apiVersion}.graphql.ts`;

const output = await codegen({
  documents: [],
  config: {
    useTypeImports: true,
    strictScalars: true,
    // https://the-guild.dev/graphql/codegen/plugins/typescript/typescript#enumsastypes
    enumsAsTypes: true,
    scalars,
  },
  // used by a plugin internally, although the 'typescript' plugin currently
  // returns the string output, rather than writing to a file
  filename: outputFile,
  schema: gqlSchema,
  plugins: [
    // Each plugin should be an object with configuration for the plugin
    {
      typescriptPlugin: {} satisfies TypescriptPluginConfig,
    },
  ],
  pluginMap: {
    typescriptPlugin,
  },
});

const output2 = await codegen({
  documents: [],
  config: {
    scalars,
    // https://the-guild.dev/graphql/codegen/plugins/typescript/typescript#enumsastypes
    enumsAsTypes: true,
  },
  filename: outputFile,
  schema: gqlSchema,
  plugins: [
    {
      validationPlugin: {
        schema: "zod",
      } satisfies ValidationSchemaPluginConfig,
    },
  ],
  pluginMap: { validationPlugin },
});

const out =
  "// GENERATED FILE: DO NOT EDIT\n" +
  "// deno-lint-ignore-file\n" +
  "// cSpell:disable\n" +
  `import { z } from "npm:zod@3.23.8";\n` +
  `import { Json } from "../types.ts";\n\n` +
  output +
  output2.substring(output2.indexOf("\n") + 1);
Deno.writeTextFileSync(outputFile, out, { create: true });

Deno.exit(); // required due to select prompt. otherwise the CLI stays open

type TypescriptPluginConfig = typescriptPlugin.TypeScriptPluginConfig;
type ValidationSchemaPluginConfig =
  validationPlugin.ValidationSchemaPluginConfig;
