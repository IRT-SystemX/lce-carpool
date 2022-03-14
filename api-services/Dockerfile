# --- Base ---
FROM keymetrics/pm2:8-alpine AS base
RUN apk update && apk add python g++ make && rm -rf /var/cache/apk/*
RUN mkdir -p /var/app
ADD package.json /var/app

# --- Release ---
FROM base AS release
MAINTAINER Maroua Meddeb <maroua.meddeb@irt-systemx.fr>
WORKDIR /var/app
ADD ecosystem.config.js .env.defaults .env.schema ./
RUN npm install grpc
COPY node_modules /var/app/node_modules
COPY ./src /var/app/src
