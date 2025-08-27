FROM alpine:3.22
RUN apk add --no-cache \
    nodejs=22.16.0-r2  \
    pnpm=10.9.0-r0 \
    openjdk8-jre-base=8.452.09-r0 \
    openjdk11-jre-headless=11.0.28_p6-r0 \
    openjdk17-jre-headless=17.0.16_p8-r0 \
    openjdk21-jre-headless=21.0.8_p9-r0
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
EXPOSE 8000
CMD [ "pnpm", "start" ]
