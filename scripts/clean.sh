#!/bin/sh
set -e
declare -r root="$(dirname "${BASH_SOURCE[0]}")/.."
rm -r "${root}"/dist/{client,server,ts}/*
yarn run tsc --force