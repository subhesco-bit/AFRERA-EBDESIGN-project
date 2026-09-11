FROM node:20-alpine

WORKDIR /workspace

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=optional

COPY backend ./backend

WORKDIR /workspace/backend
ENV NODE_ENV=development
EXPOSE 3001

CMD ["npm", "run", "dev"]
