FROM oraclelinux:7-slim

ARG release=19
ARG update=5
ENV TZ=America/Caracas

RUN mkdir -p /backend

WORKDIR /backend

COPY package.json .

RUN yum install -y gcc c++ make

RUN yum -y install oracle-release-el7 && \
    yum-config-manager --enable ol7_oracle_instantclient && \
    yum -y install oracle-instantclient$release.$update-basic

RUN curl -sL https://rpm.nodesource.com/setup_14.x | bash - 

RUN yum install -y nodejs

RUN npm install --quiet

RUN npm install nodemon -g --quiet

RUN ldconfig

RUN ln -snf /usr/share/zoneinfo/${TZ} /etc/localtime && echo ${TZ} > /etc/timezone

COPY . .

EXPOSE 3001