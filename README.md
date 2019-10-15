# app-deploy

Upload and install IPA/APK in web.

# Install

``` 
$ git clone https://github.com/phpmaple/app-deploy
$ cd app-deploy
$ docker-compose up -d
```

# Test

Open <http://<HOST_NAME>:9008> in your browser.

# Docker Deploy

* This server is not included SSL certificate. It must run behide the reverse proxy with HTTPS.

* There is a simple way to setup a HTTPS with replace `docker-compose.yml` file:

``` 

# ***** Replace ALL <YOUR_DOMAIN> to you really domain *****

version: "2"

services:
  web:
    build: .
    container_name: ipa-server
    restart: always
    environment:

      - NODE_ENV=production
      - PUBLIC_URL=https://<YOUR_DOMAIN>

    volumes:

      - "/docker/data/ipa-server:/app/upload"

```

# Deploy Without Docker

``` shell
# install node.js first
npm install
npm start
```

* now you can access *https://\<YOUR_DOMAIN\>* in your browser.# Upload Access Control

Server side:

Add `ACCESS_KEY` to system environment as password.

Client side:

Add same `ACCESS_KEY` to window.localStorage.

# Bonus

you can access *https://\<YOUR_DOMAIN\>/springboard?name=\<YOUR_APPNAME\>* to install app with single URL, not only iOS and Android, just need  app with same name

