FROM nginx:alpine@sha256:54f2a904c251d5a34adf545a72d32515a15e08418dae0266e23be2e18c66fefa

# Remove default nginx config and html
RUN rm /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*

# Copy our nginx config and static files
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY static/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
