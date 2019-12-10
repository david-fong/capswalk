#!/bin/sh
declare -r cwd="$(dirname "${BASH_SOURCE[0]}")"
npx tsc --outDir "${cwd}/.." "${cwd}/../webpack.config.ts"
npx webpack --color --config "${cwd}/../webpack.config.js"
