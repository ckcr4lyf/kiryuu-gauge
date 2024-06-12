FROM node:20-alpine

WORKDIR /app

COPY . .

RUN apk add curl
RUN curl -SsL https://downloads.gauge.org/stable | sh
RUN npm ci

ENTRYPOINT [ "/app/entrypoint.sh" ]
