FROM node:24-alpine

WORKDIR /app

COPY . .

RUN apk add curl
RUN curl -SsL https://downloads.gauge.org/stable | sh
RUN npm ci
RUN node scripts/setup-ts-node-shim.js

ENTRYPOINT [ "/app/entrypoint.sh" ]
