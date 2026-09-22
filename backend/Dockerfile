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
# Strip npm from the runtime image. Nothing here runs it — the CMD is a bare
# `node` — but Trivy reports what is PRESENT, not what is reachable, and npm
# bundles its own vulnerable tree: tar 7.5.11 (CVE-2026-59873, CRITICAL),
# pacote, sigstore, brace-expansion, picomatch, ip-address. Measured against
# node:22-alpine on 2026-09-21: 1 CRITICAL / 12 HIGH with npm, 0 / 2 without —
# 11 of those 13 findings were npm's, not Alpine's.
#
# Must run as root, so it goes above any USER line. octopus-cortex is the one
# service that keeps npm: its CVE checker shells out to `npm audit`.
# Guarded by octopus-vault/scripts/check-no-npm.mjs.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

EXPOSE 3000
CMD ["node", "index.js"]
