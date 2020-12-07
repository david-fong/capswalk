#!/bin/bash
time yarn run eslint --color --cache --cache-location './scripts/eslint-cache.json' "${@:-./src/**/*}"
