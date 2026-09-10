FROM node:24-alpine

WORKDIR /app

COPY . .

RUN apk add curl
RUN curl -SsL https://downloads.gauge.org/stable | sh
# Pin the language plugin to the same version as the gauge-ts npm package.
# Otherwise `gauge run` auto-installs latest (e.g. 0.5.1) and the launcher/runtime skew.
RUN gauge install ts -v 0.3.4
RUN npm ci
RUN node scripts/setup-ts-node-shim.js

ENTRYPOINT [ "/app/entrypoint.sh" ]
