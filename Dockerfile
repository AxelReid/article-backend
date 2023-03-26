FROM node:18

# Create app directory
WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

# RUN npm ci 
RUN yarn

COPY . .

RUN yarn build

# ENV NODE_ENV production

EXPOSE 8080
CMD [ "node", "dist/index.js" ]
USER node