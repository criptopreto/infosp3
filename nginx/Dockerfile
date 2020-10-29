FROM nginx:latest

RUN ls /etc/nginx/conf.d
RUN rm /etc/nginx/conf.d/default.conf
ADD sites-enabled/ /etc/nginx/conf.d

EXPOSE 8082