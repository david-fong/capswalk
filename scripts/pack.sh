#!/bin/sh
set -e
declare -r root="$(dirname "${BASH_SOURCE[0]}")/.."
declare -r scripts="$(dirname "${BASH_SOURCE[0]}")"

# I want to write the config in Typescript, but I don't want to install
# any dependencies to run the typescript config, so we first have to
# convert the Typescript version of the config to Javascript.
if [[ "$@" =~ '-t' ]]
then
    time pnpx tsc --project "${scripts}/webpack/tsconfig.json"
    echo 'done transpiling webpack scripts'
    echo
else
    echo
    echo 'pass "-t" to first rebuild the webpack config'
    echo
fi

# --verbose
declare -r doneMsg="$(echo -e "\n\n\n=== BUILD DONE ===\n\n\n")"
time node --title="webpack snakey3" "${scripts}/webpack/pack.js"

if [[ "$NODE_ENV" = 'production' ]]
then
    # Make sure dist has files needed for release:
    echo '' > "${scripts}/../dist/client/.nojekyll"
    cp "${scripts}/webpack/templates/stage.sh"   "${root}/dist/stage.sh"
    echo 'gitdir: ../.git/worktrees/dist'      > "${root}/dist/.git"        # for repair purposes.
    echo 'gitdir: ../../.git/worktrees/client' > "${root}/dist/client/.git" # for repair purposes.
fi
