# Use Node.js official image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install all dependencies, including devDependencies
RUN npm install

# Copy the entire project
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the TypeScript project
RUN npm run build

# Expose the port
EXPOSE 5002

# Start the application
CMD ["node", "dist/server.js"]
