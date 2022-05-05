FROM node:16.13.1

EXPOSE 3001

WORKDIR /app 

COPY package.json /app 
COPY package-lock.json /app

RUN npm ci

COPY ./src ./src
COPY ./public ./public
COPY ./LICENSE ./
COPY ./nest-cli.json ./
COPY ./README.md ./
COPY ./tsconfig.build.json ./ 
COPY ./tsconfig.json ./ 

RUN npm run build

CMD ["npm","run","start:prod"]