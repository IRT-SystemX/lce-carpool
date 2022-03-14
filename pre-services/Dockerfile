FROM node:carbon

# App directory
WORKDIR /app

# Copy app source code
COPY src src
COPY package.json package.json
COPY tsconfig.json tsconfig.json

# Install dependencies
RUN npm install

# Copy env
COPY .env .env

#Expose port and begin application
EXPOSE 9001

# Start the app
CMD [ "npm", "run", "start:dev"]
