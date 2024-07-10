# Use the official Node parent image
FROM node

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package.json and yarn.lock files
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install

# Copy the application code
COPY . .

# Build the application
RUN yarn build

# Inform Docker that the container is listening on port 7896 at runtime
EXPOSE 7896

# Run the application
CMD ["yarn", "vite", "preview", "--host", "0.0.0.0", "--port", "7896"]
