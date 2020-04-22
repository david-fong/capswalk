
# My Developer Guidelines

## Releases

1. Switch to the `gh-pages` branch, which has parts of the `dist/` folder tracked despite the `dist/` folder being matched as ignored in the top-level `.gitignore`.
1. Merge in changes from the `dev` branch.
    - `--squash`: Looks a little cleaner and prevents GitHub from double-counting commits in user contributions.
    - `--no-commit`: Don't automatically end the merge with a commit. We need to update the build output (and changelog?).
1. Run `:/scripts/pack.sh -t` to build the project. The `-t` option tells the script to transpile the webpack config before using it in case it since the previous release.
1. Stage changes, commit, and push.

```shell
git switch gh-pages
git merge --squash --no-commit dev
# Resolve merge conflicts.
export NODE_ENV='production'
./scripts/pack.sh -t
git add -u
# Add any required, untracked files.
git commit
git push
git switch -
```

TODO.build Should we be maintaining some sort of release notes / making annotated tags for releases? If so, update list and shell template right before the git staging step.

## Coding Style

This is to cover more abstract practices than rules that are covered by linting.

### ES6 #private Fields

Methodology: Use #private fields for fields that back accessors- Ie. Fields that need to be internally reassigned, but should never be directly reassigned externally. If such a field does not have a get-accessor (because it doesn't need one, leave it- do not switch it to use hard privacy.

### Field / Method Naming

#### Prefixing with Double Underscores

TLDR: use such naming if a member / variable must be public, but is only meant to be called in a very specific place.

Full Explanation: Do this if:

- The _method_ has a good reason to exist and must grant public access, but is able to put an entity into a bad state. Such methods should be called very intentionally in very specific places. The reason is usually that it behaves as a setter (abstracts away management of internal representation), or that it is a hook for extension classes to perform implementation-specific duties. Those two scenarios are actually not all that different. See `Tile.__setOccupant`, `GameBase.__abstractStatusBecome*`, `Player.__abstractNotifyThatGameStatusBecame*` for examples of this.
  - The _method_ is used to abstract the construction of an object of some abstract type. See `GameBase.__playerStatusCtor`, `GameBase.__getGridImplementation`, `GameBase.__createOperatorPlayer` for examples of this. This is a weak-rationale strain of the above classification. The main benefit being sought here is that in autocompletion, its naming will communicate that it was created to be used in a very specific place (typically in constructors).
- The _object_ is a dictionary / registry for enumerated constructor functions for instances sharing a common interface. See `base/game/IndexTasks.ts` for examples of this. These typically ask to be accessed indirectly through a more type-friendly function (one that handles any type-casting when TypeScript has a hard time tracking what's going on).
