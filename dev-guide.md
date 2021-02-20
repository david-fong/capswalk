
# Developer Guidelines

## Cloning and Building 📥

1. Clone from the git repo.
1. `pnpm install`. Make sure your shell doesn't have `NODE_ENV=production`.
1. `pnpm run devinit`.
1. `pnpm build`.
    - Note that tsc may err on the first build after adding a css module class since css-modules-typescript-loader hasn't generated the .d.ts changes for the new class yet.
1. To test off the local filesystem (no online-game capabilities), open `file://<path-to-project-root>/dist/client/index.html`.
1. To test off a local server, do `pnpm start`.
    - Instead of the file protocol, load the site at `localhost`.

## Release Procedure 🚢

```sh
rm -r dist/{client,server}/*
# bump package version in package.json.
```

### GitHub Pages Deployment 🐱‍👤

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

Restore development environment:

```sh
cd ../..
export NODE_ENV='development'
./scripts/pack.sh
```

### Server Deployment (Heroku) 🎈

TODO.doc

---

## Coding Style 🎨

Things that are not covered by linting.

### Markdown

Use single-underscore enclosures to italicize. Use double-asterisk enclosures to embolden.

### Socket.IO

- Use `socket.connect` instead of `socket.open`.
- Use `socket.disconnect` instead of `socket.close`.
- Use `to` instead of `in`.

- On the serverside, bind events to functions declared on a prototype (when possible) to avoid creating unnecessary function objects. This is not important for the client since only one connection for namespace is made.

### Logging

To make it easier to find console log messages added temporarily, added log messages, use `console.log` for those temporarily added log messages, and `console.info` for more permanent ones.

### Typescript Array Syntax

When describing array types, use the `Array<>` form if the arrays are nested (since `readonly T[][]` is not clear which dimension is readonly), or if the entry type is mainly intended to be used as an interface-style type-map. An example of when `T[]` syntax is acceptable is when `T` is a builtin literal type such as `string` and the array is one dimensional.

Do not throw strings. Use `Throw new *Error("*")`.

### Prefixing with Underscore

If access modifiers cannot be used to protect exposure to something that should only be used in a specific place, prefix it with an underscore.

### Flagging With Emoji

This project uses emojis to visually flag highly significant lines.

In large methods with short-circuit conditions, flag the return line with `return _; //⚡`.

In constructors that seal or freeze the constructed instance, flag the line with `Object.seal(this); //🧊`.

In complex socket communication chains, use 📢 for server emissions and 👂 for server "semaphore" awakenings.

### Enum Implementation

Use TypeScript enums when being able to search for references is desirable. If an enum doesn't need to be reference-searched, and avoiding a non-type import is desired, use a mocked const enum.
