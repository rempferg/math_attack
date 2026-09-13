FROM nginx:1.29-alpine

COPY index.html style.css /usr/share/nginx/html/
COPY fonts /usr/share/nginx/html/fonts/
COPY js /usr/share/nginx/html/js/
COPY deployment/nginx.container.conf /etc/nginx/conf.d/default.conf

EXPOSE 80