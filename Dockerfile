FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm i -g @getgauge/cli
RUN gauge install html-report
RUN gauge install ts
RUN gauge install screenshot

RUN npm ci

ENTRYPOINT [ "/app/entrypoint.sh" ]
