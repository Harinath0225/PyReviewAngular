### Build stage
FROM node:22-bullseye AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy source and build
COPY . ./
RUN npm run build -- --configuration production

### Production stage
FROM nginx:stable-alpine
COPY --from=build /app/dist/pyngineers /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
