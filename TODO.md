
# Things To Do

## High-level

1. Add player sprites.
1. Record music + find out how to play tracks together.
1. Make the website accessible by ARIA standards.

## Concrete TODOs

### Things I feel like doing

1. Prefix LocalStorage keys at least during development, since everything in the file:// scheme shares the same LocalStorage.
1. Make Socket interfaces for each namespace with overrides of `on` and `emit`.
1. Investigate: does `Tile` need to have the `char` field from `Tile.Changes`?
    - It is only being used for serializing the reset state.
1. Make a `JsUtil` function for shuffling an array in place. It may take an "upToIndex" (exclusive) argument for only sorting a starting range.
1. Investigate whether it works to use `Namespace.on` to cover all `socket.on`.
1. Add a `.gitattributes` file for the dist/ and dist/client/ folders to remove the `diff` behaviour where appropriate. May need to make this into a template to copy upon production builds.
1. Try to change enums back to const enums and just use string literals to avoid linkage hoops. Just make sure type checking is in effect.
1. Refactor TileGetter Query to remove all fluency. Just turn the get accessor into a function taking all the query arguments.
1. Represent lang trees as arrays, where child-parent relationships are just indices.
1. Mashup some CSS resets and normalizers for this repo.
1. Make the colours screen dynamically import its stylesheets.
1. Display the operator's current sequence buffer.
1. Webpack Add `[hash]` to output filenames and chunkFilenames when production mode.
    - Set the maxAge option for express to at least a year.
1. Make a json file or something defining all the webpack chunk names I have defined.

### Things that I feel less like doing

1. On clientside, if joiner socket gets disconnected by server, go back to the joiner screen.
1. Game-Host Servers:
    - Disable connecting to public game servers when testing / disable connecting to servers that are using incompatible versions of the client/server communication.
1. Server authentication is not working. Please debug and fix.
1. Make the cost of boosting proportional to the length of the lang-sequence of the boost-destination tile.
1. Fill in implementation of bubble event handler.

### Things that are low priority

1. Spectator mode for online games? O\_o
1. Implement the scores/player-listing sidebar in `__PlayScreen`.
    - Also show scores (very small size) on top of player faces.
1. Add a WebPack HTML plugin instance for a [custom 404 page](https://docs.github.com/en/free-pro-team@latest/github/working-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site).
1. Consider [heroku config garbage collection](https://devcenter.heroku.com/articles/node-best-practices#avoid-garbage)
1. Add git lfs support to heroku.
1. Make a build-script that creates a JSON file listing existing colour-scheme-descriptors. It should parse each scheme's author and display-name from header comments in the CSS file. The build-script could also automatically update `schemes/_barrel.css`. The JSON file should then be imported into the Screen component to create the options selector.
1. Extract hot, anonymous sorting functions to non-exported globals so the runtime engine can cache parameter shapes.

### Routine Checkups

- Check if there are any overridden setters without a getter also overridden or vice versa. This is a subtle and unexpected cause of bugs.
- `git gc`, `git prune`, `npm audit`, `npm outdated`, `npm dedupe`.
- Convert any usages of `.innerHtml` or `.innerText` to use `.textContent` unless intentional (In which case, write a comment on why it is intentional).
- Make sure nobody uses `document.createElement` instead of `JsUtil.mkEl` unless they document why it's necessary.

### Ideas

- Make a decorator to prevent overrides of a method.
  - Make JsUtils have a non-exported `WeakSet<Functions>`.
  - Make a JsUtil function that checks if a class declares any functions with the same name as anything higher in the prototype chain (see `Object.getPrototypeOf()`). Make it only apply during development.
- Start a skeleton for a "Chess Knight" Grid implementation. That would be pretty mind boggling both to play and to develop...
- Investigate whether we can create fewer functions for socket event listeners by making custom subclasses of Socket.
- When TypeScript 4.1 comes out, use the improved `@see` JSdoc annotations.
- Implement translations of clientside strings.
  - Create a sitemap file to point to translated versions
    - [Google Sitemap indicate translations](https://support.google.com/webmasters/answer/189077?hl=en)
    - [Language Tags](https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry)
      - [Choosing language tags](https://www.w3.org/International/questions/qa-choosing-language-tags)
    - Just put an argument in the url query and have the javascript parse it?
- Scroll to center the current operator if it intersects with some rootMargin of the .grid element.
  - Note: The Intersection Observer API will not work here- it doesn't trigger on re-parenting the target node.
- Test performance when using `cloneNode` to create Tile elements versus all those calls to `document.createElement`.
  - [](https://developers.google.com/web/fundamentals/web-components)
- Take a look at HTML WebPack Plugins:
  - html-webpack-tags-plugin
  - resource-hints-webpack-plugin
- Improve onboarding experience for new contributors:
  - git hook for push: if branch is `dist`, check that `dist/package.json` has changed.
- If we start using SASS, make classes that always have .center-contents or .stack-contents use an extension mechanism so we don't have to manually specify those utility classes in the javascript. That makes it easier to see whats happening from looking just at the stylesheets.
- [Create a mask-safe icon that is large enough (min 144px)](https://web.dev/maskable-icon/)
- Read about these topics and see how they might be useful
  - [](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Concepts_Behind_IndexedDB)
  - [](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
  - [](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen)
  - [](https://github.com/actions/cache)
  - Heroku
    - [](https://devcenter.heroku.com/articles/nodejs-support)
    - [](https://devcenter.heroku.com/articles/deploying-nodejs)
- To discourage players from spamming the keyboard, which would make them move chaotically really fast and defeat the educational purpose of the game, detect their success rate of pressing relevant keys, or the rate in terms of time. If they seem to be spamming, then somehow throttle their requests. Maybe stop responding for a brief period of time.
- Look into switching from JsDoc to TsDoc
  - [eslint plugin](https://www.npmjs.com/package/eslint-plugin-tsdoc)
- [custom mouse images!](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Basic_User_Interface/Using_URL_values_for_the_cursor_property)

### Dependency Management

- Try turning on `webpack.experiments.module`.
- ~Use es6 #private syntax for getter-backing fields~
  - Waiting for eslint parser plugin: `https://github.com/typescript-eslint/typescript-eslint/pull/1465#issuecomment-591562659`
  - Turn eslint back on (the vscode extension) when the typescript parser for eslint is ready.
- In package.json's scripts field, use node's `--enable-source-maps` flag when there is better support for it / we update node to a version with better support for it / I find out that there is good support and I was just using it wrong.
- Take a look at [eslint-plugin-css-modules](https://www.npmjs.com/package/eslint-plugin-css-modules).
- May be able to remove dependency on `express-static-gzip` after [this](https://github.com/expressjs/compression/issues/71) is resolved. But actually probably not :P. I think that thread is about dynamic compression.
- Turn on TypeScript experimental decorators?
  - After reading [the TC39 proposal docs](https://github.com/tc39/proposal-decorators#option-b-init-method-decorators) and seeing how much they differ from TypeScript's current spec, I don't want to commit to something that will likely change drastically in the future.

---

## Misc Ideas

- Make sound settings stubs for playing music and sound effects.
  - make BGM have a track that varies with lang and different selectable style variations such as jazz cafe/elevator music, fast 13/8.
  - Make movement sound effects able to depend on translated key input like morse sounds.

## Research / Learning Links

### Dynamic imports

Links no longer needed. Good things to know: both TypeScript and WebPack implement handling for dynamic imports. TypeScript will provide type information about the exports from a module, and WebPack will intercept the dynamic import to create a deferred-loading split chunk (A WebPack-internal mechanism).

### Web API's

I might use [this](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API) for choosing which team you want to be part of.

```text
https://developer.mozilla.org/en-US/docs/Web/API
https://web.dev/add-manifest/
https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
Navigator.{keyboard,online,connection,language,languages,battery}
https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API
https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
```

Presentation API:

- [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Presentation_API)
- [W3C](https://www.w3.org/TR/presentation-api)
- [Google Example](https://googlechrome.github.io/samples/presentation-api/)

### Audio

[AudioContextOptions](https://devdocs.io/dom/audiocontextoptions): I should make two separate contexts: one for the layered music optimized for playback and lower power consumption, and one for sound effects optimized for low latency.

When playing and pausing music, I can [fade it in and out](https://devdocs.io/dom/audioparam/exponentialramptovalueattime) and then pause and resume the audio context to save device power. Either that, or I can [apply a muffling effect](https://devdocs.io/dom/biquadfilternode) when paused.

I should keep my audio loops as short as possible. Ie. Every audio file 4 measures long except the melody file which is maybe 12 measures long.

Here's [something fun I can do](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API) (but don't have to).

```text
https://devdocs.io/dom/web_audio_api/best_practices
https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
https://www.html5rocks.com/en/tutorials/webaudio/positional_audio/
https://github.com/GoogleChromeLabs/web-audio-samples/
https://github.com/bbc/r-audio
```

### JsDoc

```text
https://devdocs.io/jsdoc/howto-es2015-classes
```

### Handling Network Latency

```text
https://martinfowler.com/eaaDev/EventSourcing.html
https://stackoverflow.com/a/9283222/11107541
```

## Things I have Tried that Haven't Worked (and that's okay)

- Tile Benching
- Being on multiple teams
- Nicety system instead of teams
- Using TypeScript's project-references feature to speed up compile time
- Turtle conduits: They actually aren't foolproof. You can just make a really big turtle wall so there's space between you and who you're trying to protect and then the conduit is broken.
