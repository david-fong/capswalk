#!/bin/sh
set -e
declare -r root="$(dirname "${BASH_SOURCE[0]}")/.."
declare -r dist="${root}/dist"
declare -r scripts="$(dirname "${BASH_SOURCE[0]}")"

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
