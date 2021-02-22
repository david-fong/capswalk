#!/bin/sh
set -e
declare -r root="$(dirname "${BASH_SOURCE[0]}")/.."
declare -r dist="${root}/dist"
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

node --title="webpack build" "${scripts}/webpack/pack.js"

if [[ "$NODE_ENV" = 'production' ]]
then
    # Make sure dist has files needed for release:
    cp "${scripts}/webpack/templates/stage.sh"   "${dist}/stage.sh"
    cp "${root}/.gitattributes"                  "${dist}/"
    cp "${root}/.gitattributes"                  "${dist}/client/"
    cp "${root}/LICENSE.md"                      "${dist}/"
    cp "${root}/LICENSE.md"                      "${dist}/client/"
    echo '/.ts/'                               > "${dist}/.gitignore"
    echo 'gitdir: ../.git/worktrees/dist'      > "${dist}/.git"        # for repair purposes.
    echo 'gitdir: ../../.git/worktrees/client' > "${dist}/client/.git" # for repair purposes.
    echo '' > "${dist}/client/.nojekyll"
fi
