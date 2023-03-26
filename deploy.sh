#!/bin/bash

echo What should the version be?
read VERSION

docker build -t asilbekalkurdi/article:$VERSION
docker push asilbekalkurdi/article:$VERSION
# ssh