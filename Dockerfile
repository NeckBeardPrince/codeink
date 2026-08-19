FROM nginxinc/nginx-unprivileged:alpine@sha256:f972e5322b9797dc2a6b830030094426437b1ae7032e4644496395336ac6fdac

# The base image runs as uid 101; switch to root only for filesystem setup
USER root
RUN rm /etc/nginx/conf.d/default.conf && rm -rf /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/security-headers.conf
COPY static/ /usr/share/nginx/html/
USER 101

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
