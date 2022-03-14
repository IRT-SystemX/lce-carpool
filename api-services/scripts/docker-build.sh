#!/usr/bin/env bash

if [[ -z "$VERSION" ]]; then
    VERSION=$(node -e "console.log(require('./package.json').version)")
fi

if [[ -z "$NAME" ]]; then
    NAME=$(node -e "console.log(require('./package.json').name.split('/').pop())")
fi

echo "$VERSION"

docker build -t "$NAME:$VERSION" "$@" .
