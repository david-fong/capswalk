#!/bin/bash
time pnpx --no-install eslint --color --cache --cache-location './node_modules/.cache/eslint-cache.json' "${@:-./src/}"
