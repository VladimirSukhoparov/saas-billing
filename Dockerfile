FROM node:18
WORKDIR /app
COPY package.json ./
COPY prisma ./prisma
RUN npm install
RUN npx prisma generate
COPY src ./src
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh
EXPOSE 3000
CMD ["./entrypoint.sh"]
