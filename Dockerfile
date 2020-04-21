FROM node:12.16.2-slim

# Install latest yarn
RUN set -eux \
    && apt-get update \
    && apt-get install -y curl \
    && curl --compressed -o- -L https://yarnpkg.com/install.sh | bash \
    && apt-get remove -y curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install node_modules from package.json and yarn.lock
WORKDIR /app/frontend
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
