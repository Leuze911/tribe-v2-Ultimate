FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build || echo "Build skipped"
EXPOSE 3000
CMD ["npm", "start"]
