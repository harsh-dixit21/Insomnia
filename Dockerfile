FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24-bookworm-slim
ENV NODE_ENV=production INSOMNIA_HOST=0.0.0.0 INSOMNIA_PORT=5181 INSOMNIA_DB=/data/insomnia.sqlite INSOMNIA_LOCAL_SERVICES=false
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv && rm -rf /var/lib/apt/lists/*
COPY requirements-iomete.txt ./
RUN python3 -m venv /opt/iomete && /opt/iomete/bin/pip install --no-cache-dir -r requirements-iomete.txt
ENV INSOMNIA_PYTHON=/opt/iomete/bin/python
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/src/lib ./src/lib
COPY --from=build /app/scripts/iomete-query.py ./scripts/iomete-query.py
COPY package.json ./
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 5181
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:5181/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm","start"]
