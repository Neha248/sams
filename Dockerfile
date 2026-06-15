FROM node:24-bookworm-slim

WORKDIR /app
ENV HOST=0.0.0.0
ENV PORT=3000

COPY package.json package-lock.json .npmrc ./
RUN npm ci && npm cache clean --force

COPY . .
RUN mkdir -p /app/data

EXPOSE 3000
CMD ["npm", "run", "dev"]
