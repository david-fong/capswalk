#!/bin/bash
npx eslint --color --cache --cache-location './scripts/eslint-cache.json' "${@:-./src/**/*}"
