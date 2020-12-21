#!/bin/sh
set -e
declare -r root="$(dirname "${BASH_SOURCE[0]}")/.."
declare -r cwd="$(dirname "${BASH_SOURCE[0]}")"

# I want to write the config in Typescript, but I don't want to install
# any dependencies to run the typescript config, so we first have to
# convert the Typescript version of the config to Javascript.
if [[ "$@" =~ '-t' ]]
then
    time pnpx tsc --project "${cwd}/webpack/tsconfig.json"
    echo 'done transpiling webpack scripts'
    echo
else
    echo
    echo 'pass "-t" to first rebuild the webpack config'
    echo
fi


# --verbose
declare -r doneMsg="$(echo -e "\n\n\n=== BUILD DONE ===\n\n\n")"
time node "${cwd}/webpack/pack.js"
echo '' > "${cwd}/../dist/client/.nojekyll"

echo 'gitdir: ../.git/worktrees/dist' > "${root}/dist/.git" # for repair purposes.
echo 'gitdir: ../../.git/worktrees/client' > "${root}/dist/client/.git" # for repair purposes.
