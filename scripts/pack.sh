#!/bin/sh
declare -r cwd="$(dirname "${BASH_SOURCE[0]}")"
npx tsc --build "${cwd}/webpack.tsconfig.json"
npx webpack --verbose --color --config "${cwd}/../webpack.config.js"
