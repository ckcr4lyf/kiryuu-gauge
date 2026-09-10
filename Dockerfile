FROM node:24-alpine

WORKDIR /app

COPY . .

RUN apk add curl
RUN curl -SsL https://downloads.gauge.org/stable | sh
# GitHub Actions container jobs remap HOME to /github/home (empty mount).
# Gauge defaults to $HOME/.gauge for plugins+config, so the image-baked 0.3.4
# plugin is invisible and `gauge run` installs latest (0.5.1). Pin both install
# and lookup to GAUGE_HOME, which Actions does not override.
ENV GAUGE_HOME=/opt/gauge
RUN mkdir -p "$GAUGE_HOME"
RUN gauge install ts -v 0.3.4
RUN gauge install html-report
RUN npm ci
RUN node scripts/setup-ts-node-shim.js

ENTRYPOINT [ "/app/entrypoint.sh" ]
