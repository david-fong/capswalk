
# Developer Guidelines

## Cloning and Building 📥

1. Clone from the git repo.
1. When using VsCode, make sure to use the workspace version of TypeScript.
1. `pnpm install`. Make sure your shell doesn't have `NODE_ENV=production`.
1. `pnpm run devinit`.
1. `pnpm build`.
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
pnpm run build
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
pnpm run build
```

### Server Deployment (Heroku) 🎈

TODO.doc

---

## Routine Checkups

- Check if there are any overridden setters without a getter also overridden or vice versa. This is a subtle and unexpected cause of bugs.
- Make sure no usages of `Function.bind` bind functions providing without providing all arguments and then pass the bound function to something that can pass default arguments in a more subtle way (such as DOM on\_ functions).
- Don't call `Array.prototype.sort` with no arguments for numbers. The default behaviour involves coercion into strings.
- Convert any usages of `.innerHtml` or `.innerText` to use `.textContent` unless intentional (In which case, write a comment on why it is intentional).
- Make sure nobody uses `document.createElement` instead of `JsUtil.html` unless they document why it's necessary.
- Make sure to import json using `default` instead of `*` syntax. Otherwise, something in the build pipeline adds an unwanted enumerable key.
- On the serverside, whenever broadcasting to WebSockets, only send to the socket if its `readyState` is `OPEN`.

## Coding Style 🎨

Things that are not covered by linting.

### Markdown

Use single-underscore enclosures to italicize. Use double-asterisk enclosures to embolden.

### ReadonlyArray

Use `readonly T[]` instead of `ReadonlyArray<T>`.

### Logging

To make it easier to find console log messages added temporarily, added log messages, use `console.log` for those temporarily added log messages, and `console.info` for more permanent ones.

### Prefixing with Underscore

If access modifiers cannot be used to protect exposure to something that should only be used in a specific place, prefix it with an underscore.

### Flagging With Emoji

This project uses emojis to visually flag highly significant lines.

In large methods with short-circuit conditions, flag the return line with `return _; //⚡`.

In constructors that seal or freeze the constructed instance, flag the line with `Object.seal(this); //🧊`.

In complex socket communication chains, use 📢 for server emissions and 👂 for server "semaphore" awakenings.

### CSS animations and transitions

Check the browser repaint amount and CPU usage. If repaint is large, try to solve it with containment. If CPU usage is high, try using the `steps(N)` timing function.

### Enum Implementation

Use TypeScript enums when being able to search for references is desirable. If an enum doesn't need to be reference-searched, and enabling type-only imports is desired, use a mocked const enum. By reference searching, I mean that the literal value can be inlined and recognized there as a member of an enum when searching for other references.
