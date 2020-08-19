
# My Developer Guidelines

## Release Procedure

Update the `version` field in [package.json](package.json).

```shell
git switch gh-pages
git checkout dev .
echo 'y' | rm -r dist/*
$EDITOR package.json
tsc --force # Delete any old artifacts of folder renaming.
export NODE_ENV='production'
./scripts/pack.sh -t
```

Sanity check that everything is running properly for online and offline implementations.

```shell
git add -u
git add -f dist/{client,server}
git commit # Start message with current hash of dev branch.
git push
npm publish --dry-run # Check included files.
npm publish
```

Now let's go back to development:

```shell
git switch dev
export NODE_ENV='development'
echo 'y' | rm -r dist/{client,server}
npx tsc -b --force
./scripts/pack.sh -t
$EDITOR package.json
```

TODO.build Should we be maintaining some sort of release notes / making annotated tags for releases? If so, update list and shell template right before the git staging step.

## Coding Style

This is to cover more abstract practices than rules that are covered by linting.

### Markdown

Use single-underscore enclosures to italicize. Use double-asterisk enclosures to embolden.

### ES6 #private Fields

Methodology: Use #private fields for fields that back accessors- Ie. Fields that need to be internally reassigned, but should never be directly reassigned externally. If such a field does not have a get-accessor (because it doesn't need one, leave it- do not switch it to use hard privacy.

### Field / Method Naming

#### Prefixing with Underscore

TLDR: use such naming if a member / variable must be public, but is only meant to be called in a very specific place.

Full Explanation: Do this if:

- The _method_ has a good reason to exist and must grant public access, but is able to put an entity into a bad state. Such methods should be called very intentionally in very specific places. The reason is usually that it behaves as a setter (abstracts away management of internal representation), or that it is a hook for extension classes to perform implementation-specific duties. Those two scenarios are actually not all that different. See `Tile._setOccupant`, `GameBase._abstractStatusBecome*`, `Player._abstractNotifyThatGameStatusBecame*` for examples of this.
  - The _method_ is used to abstract the construction of an object of some abstract type. See `GameBase._playerStatusCtor`, `GameBase._getGridImplementation`, `GameBase._createOperatorPlayer` for examples of this. This is a weak-rationale strain of the above classification. The main benefit being sought here is that in autocompletion, its naming will communicate that it was created to be used in a very specific place (typically in constructors).
- The _object_ is a dictionary / registry for enumerated constructor functions for instances sharing a common interface. See `base/game/IndexTasks.ts` for examples of this. These typically ask to be accessed indirectly through a more type-friendly function (one that handles any type-casting when TypeScript has a hard time tracking what's going on).
