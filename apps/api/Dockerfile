FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY src ./src
COPY tsconfig*.json ./
RUN npm run build || echo "Build skipped"
EXPOSE 4000
CMD ["node", "dist/main.js"]
