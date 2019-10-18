#!/bin/bash

set -e

git reset --hard

git pull

docker-compose up -d --force-recreate --build
