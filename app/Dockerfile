# Use official Node image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy remaining app files
COPY . .

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "index.js"]