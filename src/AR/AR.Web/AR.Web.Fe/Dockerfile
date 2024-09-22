FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY \
  src/AR/AR.Web/AR.Web.Fe/package.json . \
  src/AR/AR.Web/AR.Web.Fe/package-lock.json* ./
RUN npm i

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY src/AR/AR.Web/AR.Web.Fe .

ENV NEXT_TELEMETRY_DISABLED 1
ARG DEPLOY_ENV
ARG POSTHOG_HOST
ARG POSTHOG_KEY
ENV DEPLOYMENT_ENVIRONMENT ${DEPLOY_ENV}
ENV NEXT_PUBLIC_POSTHOG_KEY ${POSTHOG_KEY}
ENV NEXT_PUBLIC_POSTHOG_HOST ${POSTHOG_HOST}

RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV NEXT_PUBLIC_POSTHOG_KEY ${POSTHOG_KEY}
ENV NEXT_PUBLIC_POSTHOG_HOST ${POSTHOG_HOST}

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["npm", "start"]