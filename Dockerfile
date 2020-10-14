# Using the latest Node 14
# FROM ubuntu:20.04
FROM node:14

# Set a working directory to use
WORKDIR /code

# Copy package management files to
# the working directory
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Deploy the changes
CMD yarn build:all