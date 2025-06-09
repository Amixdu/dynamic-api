FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Update npm to the latest version to patch its own dependencies
RUN npm install -g npm@latest

# Copy package.json and package-lock.json first to leverage Docker cache
# If these files don't change, we don't need to reinstall dependencies on every build
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of your application code into the container
COPY . .

# Grant execute permissions to our entrypoint script
RUN chmod +x ./entrypoint.sh

# This entrypoint script will be executed when the container starts
ENTRYPOINT ["./entrypoint.sh"]