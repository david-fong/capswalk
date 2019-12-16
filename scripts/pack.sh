#!/bin/sh
set -e
declare -r cwd="$(dirname "${BASH_SOURCE[0]}")"

# I want to write the config in Typescript, but I don't want to install
# any dependencies to run the typescript config, so we first have to
# convert the Typescript version of the config to Javascript.
if [[ "$@" =~ '-t' ]]
then
    time npx tsc --build "${cwd}/webpack.tsconfig.json"
    echo 'built the webpack config'
    echo
else
    echo
    echo 'pass "-t" to first rebuild the webpack config'
    echo
fi


# --verbose
# interesting note: if you export an array of configs, the
# stats.color argument is ignored... I haven't fiddled to
# see what else is like this.
declare -r doneMsg="$(echo -e "\n=== BUILD DONE ===\n")"
npx webpack --color --build-delimiter="${doneMsg}" --config "${cwd}/../webpack.config.js"

# TODO: check that the html requests all the necessary javascript files.
