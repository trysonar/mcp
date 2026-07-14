# Used by MCP registry inspectors (Glama) to verify the server starts and
# answers introspection over stdio. Not part of the npm publish.
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* tsconfig.json tsup.config.ts ./
COPY src ./src
RUN npm install --ignore-scripts && npm run build
CMD ["node", "dist/index.mjs"]
