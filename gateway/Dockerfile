FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . . 

RUN npm run build

# src/views → dist/views 로 복사
COPY ./src/views ./dist/views 

# src/public -> dist/public 복사
COPY ./public ./dist/public

#CMD ["npm", "run", "start:dev"] 
CMD ["npm", "run", "start:prod"]
