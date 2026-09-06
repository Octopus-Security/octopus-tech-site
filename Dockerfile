# Use the lightweight Nginx image
FROM nginx:alpine

RUN apk upgrade --no-cache

# Remove the default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy YOUR site files into the container
COPY public /usr/share/nginx/html

# Fix permissions so Nginx can definitely read them
RUN chmod -R 755 /usr/share/nginx/html

# Replaces the stock default.conf — see nginx.conf for why the cache policy
# matters here specifically.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ── Deploy verification ───────────────────────────────────────────────────────
#
# Portainer polls and reports back to nobody, so a deploy that never landed and
# one that landed without helping look identical from outside. Every other
# service in the estate answers that with /api/build; this one has no
# application process to compute a stamp at startup, so it is computed HERE,
# from the files actually in the image, and written out as a static document.
#
# DERIVED, not typed. A stamp someone has to remember to bump reports "nothing
# changed" for a deploy that did, the first time anyone forgets — a check
# failing in the confident direction. This one cannot drift: it is a hash of
# every served .html, .css and .js, which on this site includes the ?v= stamps
# themselves, so a re-stamped page moves it.
#
# `builtAt` rather than the `startedAt` the Node services report: nginx serves a
# file, there is no application start, and the field is named for what it is.
#
# The api/ directory is created after the hash is taken, so the stamp never
# covers its own output.
RUN set -eu; \
    BUILD="$(find /usr/share/nginx/html -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' \) \
             | LC_ALL=C sort | xargs sha256sum | sha256sum | cut -c1-12)"; \
    mkdir -p /usr/share/nginx/html/api; \
    printf '{"ok":true,"service":"octopus-technology","build":"%s","builtAt":"%s"}\n' \
      "$BUILD" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > /usr/share/nginx/html/api/build
