#!/bin/sh
# This script is run as the npm postinstall lifecycle script.
#set -e

declare -r root="$(dirname "${BASH_SOURCE[0]}")/.."
git config --local 'core.hooksPath' "${root}/scripts/githooks"
#git config --local 'core.fsmonitor' 'scripts/githooks/fsmonitor-watchman'

if [[ -z "$(git worktree list | command grep -o '\[dist]')" ]]; then
  git worktree add dist/ dist
  git worktree lock --reason 'This is the server/npm deployment branch' dist
  # If you already checked out `dist`, then you can just do `git worktree add dist/ dist`.
fi
echo 'gitdir: ../.git/worktrees/dist' > "${root}/dist/.git" # for repair purposes.

if [[ -z "$(git worktree list | command grep -o '\[gh-pages]')" ]]; then
  git worktree add dist/client/ gh-pages
  git worktree lock --reason 'This is the GitHub Pages deployment branch' client
  # If you already checked out `gh-pages`, then you can just do `git worktree add dist/client/ gh-pages`.
fi
echo 'gitdir: ../../.git/worktrees/client' > "${root}/dist/client/.git" # for repair purposes.

# Transpile the webpack config:
echo "transpiling webpack build-scripts..."
npx tsc --project "${root}/scripts/webpack/tsconfig.json"
