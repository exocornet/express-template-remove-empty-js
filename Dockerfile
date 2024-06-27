FROM node:22.2.0-bullseye-slim

WORKDIR /app

RUN apt update && apt install git autoconf automake gcc make g++ libtool -y && cd /app && git init

COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 8000

CMD ["npm", "start"]
