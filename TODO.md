
# Things To Do

## High-level

1. Get a basic, working implementation of an offline game.
1. Write the stylesheets + consider SASS.
1. Record music + find out how to play tracks together.
1. Get working bundles for networked games.

## Concrete TODOs

### High Priority

1. Brainstorm ways to split up the js and css to defer loading.
    - The lang implementations are particularly large, and the user might only ever use one.
    - Can we make all game related code get loaded on demand? Not loaded until user tries to start a game.
      - Same with game-grid related CSS.
    - [How WebPack compiles dynamic imports](https://webpack.js.org/api/module-methods/#import-1).
1. Make and hook up lang registry (initialize in PostInit, define under Lang).
1. Implement Euclid2 spawn coordinates.
1. Implement health spawning.
1. Implement basic artificial player.
1. Fill in implementation of bubble event handler.
1. Design decision: Change bubble mechanism:
    - Activates automatically and immediately upon players entering each others' (mutual) attack range, or by pressing space in the (mutual) attack range of other players.
    - When done automatically, health will be levelled-down enough to cause as many changes in downed-ness as possible by changing other players' health to zero.
    - If done by pressing space, health will be levelled further until the space-presser's health is at zero.
    - The player with the highest health upon contact, or the player who pressed space is considered the attacker.
      - First, for each un-downed enemy (non-teammate) in range (sorted to evenly distribute downed-ness), the attacker will subtract that enemy's health+1 from its own, causing that enemy to become downed (health === -1 \< 0) until all enemies are downed, or any further whole-health-subtractions would cause it to become downed.
      - If it still has more health, it does something similar for its teammates.

### Low Priority

- Read about these topics and see how they might be useful
  - [](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_timing_API)
  - [](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen)
  - [](https://github.com/danklammer/bytesize-icons)
  - Heroku
    - [](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
    - [](https://devcenter.heroku.com/articles/deploying-nodejs)
    - [](https://devcenter.heroku.com/articles/node-best-practices)
    - [](https://devcenter.heroku.com/articles/nodejs-support)
- To discourage players from spamming the keyboard, which would make them move chaotically really fast and defeat the educational purpose of the game, detect their success rate of pressing relevant keys, or the rate in terms of time. If they seem to be spamming, then somehow throttle their requests. Maybe stop responding for a brief period of time.
- For classes implementing some swappable component or ones in a long class hierarchy, see if there are elegance-improvements to be made by using re-exports.
- Look into switching from JsDoc to TsDoc
  - [eslint plugin](https://www.npmjs.com/package/eslint-plugin-tsdoc)

### Dependency Management

- Use es6 #private syntax for getter-backing fields
  - Waiting for eslint parser plugin: `https://github.com/typescript-eslint/typescript-eslint/pull/1465#issuecomment-591562659`
  - Turn eslint back on (the vscode extension) when the typescript parser for eslint is ready.
- WebPack 5:
  - [Magic dynamic import strings](https://webpack.js.org/migrate/5/#cleanup-the-code) will start getting useful values by default.
  - `output.ecmaVersion` is `6` by default. If we have set it to `6` manually, we can delete the manual field specification.

---

## Important Ideas to Develop

- Make sound settings stubs for playing music and sound effects.
  - make BGM have a track that varies with lang and different selectable style variations such as jazz cafe/elevator music, fast 13/8.
  - Make movement sound effects able to depend on translated key input like morse sounds.

## Research / Learning Links

### Dynamic imports

```text
https://javascript.info/modules-dynamic-imports
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
https://github.com/tc39/proposal-dynamic-import/#import
https://v8.dev/features/dynamic-import
```

### ES6 modules in NodeJS

```text
https://stackoverflow.com/questions/45854169/how-can-i-use-an-es6-import-in-node
https://medium.com/@iamstan/typescript-es-modules-micheal-jackson-2040216be793
https://nodejs.org/api/esm.html#esm_enabling
```

### Web API's

I might use [this](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API) for choosing which team you want to be part of.

```text
https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets

https://developer.mozilla.org/en-US/docs/Web/API
https://web.dev/add-manifest/
https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
https://www.w3schools.com/html/html5_webstorage.asp
https://www.w3schools.com/html/html5_serversentevents.asp
Navigator.{keyboard,online,connection,language,languages,battery}
https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API
```

### JsDoc

```text
https://devdocs.io/jsdoc/howto-es2015-classes
```

### Audio

[AudioContextOptions](https://devdocs.io/dom/audiocontextoptions): I should make two separate contexts: one for the layered music optimized for playback and lower power consumption, and one for sound effects optimized for low latency.

When playing and pausing music, I can [fade it in and out](https://devdocs.io/dom/audioparam/exponentialramptovalueattime) and then pause and resume the audio context to save device power. Either that, or I can [apply a muffling effect](https://devdocs.io/dom/biquadfilternode) when paused.

For the background music track, I will have multiple layers. They will all be the same length, except for the main melody track that will be some whole-number multiple in length. For all the short ones, we can [load them up into mono buffers](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData) using the [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), and then combine all those buffers as channels in one [AudioBuffer](https://devdocs.io/dom/audiobuffer). That will be the buffer for a looping [AudioBufferSourceNode](https://devdocs.io/dom/audiobuffersourcenode). I connect that source node to a [ChannelSplitterNode](https://devdocs.io/dom/channelsplitternode), which passes each channel through a gain node, then joins them back into one node via [ChannelMergerNode](https://devdocs.io/dom/channelmergernode). Those fader-mixed tracks (channels) will be connected to some more stereo effects, and finally to the context output destination.

I should keep my audio loops as short as possible. Ie. Every audio file 4 measures long except the melody file which is maybe 12 measures long.

```text
https://devdocs.io/dom/web_audio_api/best_practices
https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
https://www.html5rocks.com/en/tutorials/webaudio/positional_audio/
https://github.com/GoogleChromeLabs/web-audio-samples/
https://github.com/bbc/r-audio
```

```text
https://expressjs.com/en/api.html#app.set
https://stackoverflow.com/a/38129612/11107541
```

### CSS

```text
styling east-asian fonts: https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-east-asian
https://stackoverflow.com/a/45802847/11107541
https://devdocs.io/css/clip-path
https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Backgrounds_and_borders
https://developer.mozilla.org/en-US/docs/Web/CSS/display
https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing
flex playground: https://codepen.io/enxaneta/full/adLPwv/
```

### Handling Network Latency

```text
https://martinfowler.com/eaaDev/EventSourcing.html
https://stackoverflow.com/a/9283222/11107541
```

## Good Reads

```text
https://javascript.info/class-inheritance
https://medium.com/better-programming/prototypes-in-javascript-5bba2990e04b
https://www.quirksmode.org/js/events_order.html#link4
https://www.mikedoesweb.com/2017/dynamic-super-classes-extends-in-es6/
https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Cross_browser_testing/JavaScript
```

## Things I have Tried that Haven't Worked (and that's okay)

- Tile Benching
- Being on multiple teams
- Nicety system instead of teams
- Using TypeScript's project-references feature to speed up compile time
- Turtle conduits: They actually aren't foolproof. You can just make a really big turtle wall so there's space between you and who you're trying to protect and then the conduit is broken.
