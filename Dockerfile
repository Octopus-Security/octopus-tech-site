# Use the lightweight Nginx image
FROM nginx:alpine

# Remove the default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy YOUR site files into the container
COPY public /usr/share/nginx/html

# Fix permissions so Nginx can definitely read them
RUN chmod -R 755 /usr/share/nginx/html
