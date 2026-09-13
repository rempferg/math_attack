FROM nginx:1.29-alpine

COPY index.html style.css /usr/share/nginx/html/
COPY fonts /usr/share/nginx/html/fonts/
COPY js /usr/share/nginx/html/js/
COPY deployment/nginx.container.conf /etc/nginx/conf.d/default.conf

# Asset filenames are not content-hashed, so append the game version as a
# cache-busting query. index.html is served no-store, so browsers pick up the
# new asset URLs on every deploy.
RUN V="$(grep -oE 'V[0-9]+' /usr/share/nginx/html/js/scenes/menu.js | head -n1)" && \
    V="${V#V}" && \
    sed -i "s|href=\"style.css\"|href=\"style.css?v=${V}\"|g; s|src=\"\(js/[^\"]*\)\"|src=\"\1?v=${V}\"|g" /usr/share/nginx/html/index.html

EXPOSE 80