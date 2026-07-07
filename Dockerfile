FROM nginxinc/nginx-unprivileged:alpine@sha256:592b23aa79a6e6c08ba4b20f1fff700e1328895705966722608e115d62e52d39

# The base image runs as uid 101; switch to root only for filesystem setup
USER root
RUN rm /etc/nginx/conf.d/default.conf && rm -rf /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/security-headers.conf
COPY static/ /usr/share/nginx/html/
USER 101

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
