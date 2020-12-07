
# My Developer Guidelines

## Cloning and Building

1. Clone from the git repo. The default branch is `dev`.
1. `yarn install`. Note on a sneaky gotcha: Make sure your shell doesn't have `NODE_ENV=production`.
1. `yarn run devinit`.
1. `yarn run build`.
    - Note that tsc may err on the first build after adding a css module class since css-modules-typescript-loader hasn't generated the .d.ts changes for the new class yet.
1. To test off the local filesystem (no online-game capabilities), open `file://<path-to-project-root>/dist/client/index.html`.
1. To test off a local server, do `npm start`.
    - Instead of the file protocol, load the site at localhost.
1. Notes on repairing git worktrees used for deployment:
    - Avoid commands that would delete either of the file `dist/.git` or `dist/client/.git`.
    - If you accidentally delete them, just rerun `npm run devinit`, which recreates them with the contents `gitdir: ../.git/worktrees/dist` and `gitdir: ../../.git/worktrees/client` respectively.

## Release Procedure

```sh
rm -r dist/{client,server}/*
# bump package version in package.json.
```

### GitHub Pages Deployment

```sh
export NODE_ENV='production'
./scripts/pack.sh -t
# Sanity check that everything is running properly for online and offline implementations.

cd dist/client
git add .
git commit # Start message with current hash of dev branch.
git push

git tag -s 'vX.X.X'
git push --tags
# Update the GitHub repo with details of the release.
```

Now let's go back to development:

```sh
cd ../..
export NODE_ENV='development'
./scripts/pack.sh
```

### Server Deployment (Heroku)

TODO.doc

## Coding Style

This is to cover more abstract practices than rules that are covered by linting.

### Markdown

Use single-underscore enclosures to italicize. Use double-asterisk enclosures to embolden.

### Socket.IO

- Use `socket.connect` instead of `socket.open`.
- Use `socket.disconnect` instead of `socket.close`.
- Use `to` instead of `in`.

- On the serverside, bind events to functions declared on a prototype (when possible) to avoid creating unnecessary function objects. This is not important for the client since only one connection for namespace is made.

### ES6 #private Fields

Methodology: Use #private fields for fields that back accessors- Ie. Fields that need to be internally reassigned, but should never be directly reassigned externally. If such a field does not have a get-accessor (because it doesn't need one, leave it- do not switch it to use hard privacy.

### Field / Method Naming

### Logging

To make it easier to find console log messages added temporarily, added log messages, use `console.log` for those temporarily added log messages, and `console.info` for more permanent ones.

### Typescript Array Syntax

When describing array types, use the `Array<>` form if the arrays are nested (since `readonly T[][]` is not clear which dimension is readonly), or if the entry type is mainly intended to be used as an interface-style type-map. An example of when `T[]` syntax is acceptable is when `T` is a builtin literal type such as `string` and the array is one dimensional.

Do not throw strings. Use `Throw new *Error("*")`.

### Prefixing with Underscore

TLDR: use such naming if a member / variable must be public, but is only meant to be called in a very specific place.

Full Explanation: Do this if:

- The _method_ has a good reason to exist and must grant public access, but is able to put an entity into a bad state. Such methods should be called very intentionally in very specific places. The reason is usually that it behaves as a setter (abstracts away management of internal representation), or that it is a hook for extension classes to perform implementation-specific duties. Those two scenarios are actually not all that different. See `Tile._setOccupant`, `GameBase._abstractStatusBecome*`, `Player._abstractNotifyThatGameStatusBecame*` for examples of this.
  - The _method_ is used to abstract the construction of an object of some abstract type. See `GameBase._playerStatusCtor`, `GameBase._getGridImplementation`, `GameBase._createOperatorPlayer` for examples of this. This is a weak-rationale strain of the above classification. The main benefit being sought here is that in autocompletion, its naming will communicate that it was created to be used in a very specific place (typically in constructors).
- The _object_ is a dictionary / registry for enumerated constructor functions for instances sharing a common interface. See `base/game/IndexTasks.ts` for examples of this. These typically ask to be accessed indirectly through a more type-friendly function (one that handles any type-casting when TypeScript has a hard time tracking what's going on).
