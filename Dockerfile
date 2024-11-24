#Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json .
COPY tsconfig.json .

RUN npm install
RUN npm rebuild bcrypt

COPY . .

RUN npm run build

#Production stage
FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json .

RUN mkdir node_modules && npm ci --only=production --ignore-scripts
# https://github.com/kelektiv/node.bcrypt.js/issues/800
RUN npm rebuild bcrypt

COPY --from=build /app/dist ./dist
COPY --from=build /app/tsconfig-paths-bootstrap.js .
COPY --from=build /app/tsconfig.json .

CMD ["npm", "run", "start"]