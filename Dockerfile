FROM nginxinc/nginx-unprivileged:alpine@sha256:18d67281256ded39ff65e010ae4f831be18f19356f83c60bc546492c7eb6dd23

# The base image runs as uid 101; switch to root only for filesystem setup
USER root
RUN rm /etc/nginx/conf.d/default.conf && rm -rf /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/security-headers.conf
COPY static/ /usr/share/nginx/html/
USER 101

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
