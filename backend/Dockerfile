FROM node:22-alpine
WORKDIR /app
# bcrypt is a native module: it compiles against THIS image's musl rather than
# downloading a glibc binary. Node 18 -> 22 changes the ABI, so a prebuild that
# happened to exist for 18 is not the one this image needs. Build it here, and
# drop the toolchain again so it does not ride along in the final image.
# (Same lesson as octopus-planner and alfred-js.)
COPY package*.json ./
RUN apk add --no-cache --virtual .build python3 make g++ \
 && npm install \
 && apk del .build
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
