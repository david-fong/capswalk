#!/bin/sh
declare -r scripts="$(dirname "${BASH_SOURCE[0]}")"
npx tsc --outDir "${scripts}" "${scripts}/../webpack.config.ts"
npx webpack --color --config "${scripts}/webpack.config.js"
