#!/bin/sh
declare -r cwd="$(dirname "${BASH_SOURCE[0]}")"

# I want to write the config in Typescript, but I don't want to install
# any dependencies to run the typescript config, so we first have to
# convert the Typescript version of the config to Javascript.
npx tsc --build "${cwd}/webpack.tsconfig.json"

# --verbose
npx webpack --config "${cwd}/../webpack.config.js"
