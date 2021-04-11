
# Things To Do

## High-level

1. Finalize what I want to game to actually be :(
1. Implement a keyboard learning / language learning page.
1. Harden server against malicious/malformed client inputs.
    - handle malformed websocket data from client. Just ignore it?
    - change exceptions on malformed data to short circuits?
1. Record music.

## Concrete TODOs

### Things I feel like doing

1. Replace usages of `ReadonlyArray` with `readonly []`.
1. Implement `VisibleGrid` rendering of player positions.
    - Experiment with ways to make rendering more performant / optimize the repaint surface.
      - Perhaps there is a more direct way to animate in SVG instead of CSS transition. Web Animations API?
      - Or maybe it will be better to break the players into a separate "layer" instead of making them part of the pattern tiling.
    - Find out how to prevent "carriage return" when players move wrapping around the edge.
      - Use the `from` param in `Grid.moveEntity` to check whether wrapping happened.
    - The current usage of using a CSS transition on the transform property is not working for Firefox.
1. See if there is merit in giving any tile getters an argument on whether to filter for occupied or unoccupied tiles.
1. Implement a requirement that the number of players is less than the area of the grid.
1. Implement websocket heartbeat to check for broken connections (see ws readme for example).
1. Display the operator's current sequence buffer.
    - Or perhaps make a fancy "crosshair" that outlines tiles that match the current sequence buffer.

### Things that I feel less like doing

1. Webpack Add `[hash]` to output filenames and chunkFilenames when production mode.
    - Set the maxAge option for http server to at least a year.
1. Game-Host Servers:
    - Disable connecting to public game servers when testing / disable connecting to servers that are using incompatible versions of the client/server communication.
1. Change JsUtils to not wrap all its exports as an object?
    - The current wrapping is generally considered bad practice... But for this specific case I don't really mind it. If I were to refactor it all to `import * as JsUtils from ...`, it would enable inconsistent naming of the wrapper object.

### Things that are low priority

1. Try to change enums back to const enums and just use string literals to avoid linkage hoops. Just make sure type checking is in effect.
1. Make a `JsUtil` function for shuffling an array in place. It may take an "upToIndex" (exclusive) argument for only sorting a starting range.
1. Spectator mode for online games? O\_o
1. Add a WebPack HTML plugin instance for a [custom 404 page](https://docs.github.com/en/free-pro-team@latest/github/working-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site).
1. Consider [heroku config garbage collection](https://devcenter.heroku.com/articles/node-best-practices#avoid-garbage)
1. Make a build-script that creates a JSON file listing existing colour-scheme-descriptors. It should parse each scheme's author and display-name from header comments in the CSS file. The build-script could also automatically update `schemes/_barrel.css`. The JSON file should then be imported into the Screen component to create the options selector.
1. Mashup some CSS resets and normalizers for this repo? Or maybe we don't need any.
1. Experiment: Represent lang trees as arrays, where child-parent relationships are just indices.

### Ideas

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
- Improve onboarding experience for new contributors:
  - git hook for push: if branch is `dist`, check that `dist/package.json` has changed.
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

### Bleeding Edge Experiments

- Try turning on `webpack.experiments.module`.
- Turn on TypeScript experimental decorators?
  - After reading [the TC39 proposal docs](https://github.com/tc39/proposal-decorators#option-b-init-method-decorators) and seeing how much they differ from TypeScript's current spec, I don't want to commit to something that will likely change drastically in the future.

---

## Research / Learning Links

### Web API's

```text
https://developer.mozilla.org/en-US/docs/Web/API
```

Presentation API:

- [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Presentation_API)
- [W3C](https://www.w3.org/TR/presentation-api)
- [Google Example](https://googlechrome.github.io/samples/presentation-api/)

### Audio

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
