
import type { CodegenConfig } from '@graphql-codegen/cli';
import "dotenv/config";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const config: CodegenConfig = {
  overwrite: true,
  schema: `${API_BASE_URL}/graphql`,
  documents: "**/*.frag.graphql",
  generates: {
    './graphql/types.gen.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typed-document-node',
      ],
      config: {
        useTypeImports: true,
        immutableTypes: true,
        enumsAsConst: true,
        avoidOptionals: true,
      },
    },
    "./graphql/schema.gen.json": {
      plugins: ["introspection"]
    }
  }
};

export default config;
