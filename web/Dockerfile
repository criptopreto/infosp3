FROM python:3.8-alpine

ENV TZ America/Caracas
RUN mkdir -p /code
WORKDIR /code

#Establecer las variables de Entorno
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

#Instalar las dependencias
COPY requirements.txt /code
RUN python -m pip install --upgrade pip
RUN \
    apk add --no-cache postgresql-libs && \
    apk add --no-cache --virtual .build-deps gcc musl-dev postgresql-dev && \
    python3 -m pip install -r requirements.txt --no-cache-dir && \
    apk add bash && \
    apk --purge del .build-deps

#Copiar el proyecto
COPY . /code

RUN mkdir -p ./static/admin

EXPOSE 9000