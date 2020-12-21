#!/bin/bash
time pnpx --no-install eslint --color --cache --cache-location './scripts/eslint-cache.json' "${@:-./src/**/*}"
