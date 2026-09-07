FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ENV VITE_BASE_PATH=/
RUN npm run build
ENV NODE_ENV=production
ENV PORT=8080
ENV OMNIROUTE_PORT=20128
ENV OMNIROUTE_DATA_DIR=/data/omniroute
VOLUME ["/data/omniroute"]
EXPOSE 8080
CMD ["npm", "run", "start:fullstack"]
