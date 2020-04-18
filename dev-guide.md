
# My Developer Guidelines

## OOP Style

This is to cover more abstract practices than rules that are covered by linting.

### ES6 #private fields

Methodology: Use #private fields for fields that back accessors- Ie. Fields that need to be internally reassigned, but should never be directly reassigned externally. If such a field does not have a get-accessor (because it doesn't need one, leave it- do not switch it to use hard privacy.

## Releases

1. Switch to the `gh-pages` branch, which has parts of the `dist/` folder tracked despite the `dist/` folder being matched as ignored in the top-level `.gitignore`.
1. Merge in changes from the `dev` branch. Use the `--no-ff` option. That's just a preference of mine that we'll stick to.
1. Run `:/scripts/pack.sh` to build the project.
1. Stage changes, commit, and push.

TODO.build Should we be maintaining some sort of release notes / making annotated tags for releases?
