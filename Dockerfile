FROM node:24-alpine

WORKDIR /

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 4200

CMD ["npm" "start"]