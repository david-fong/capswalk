
# Things To Do

## High-level

1. Get a basic, working implementation of an offline game.
1. Write the stylesheets.
1. Get working bundles for networked games.
1. Add player sprites.
1. Record music + find out how to play tracks together.
1. Make the website accessible by ARIA standards.

## Concrete TODOs

### High Priority

1. ~Make LangSeqTreeNode extend the Root variant.~
    - Make `inheritingWeightedHitCount` protected in the Root variant, and then use it in reset to weigh the shuffle sort toward weightier CSP's. Or maybe just go back to the slower shuffle method. That one has more accurate / desirable results with state setup.
1. Make artificial players' timers take into account how many keypresses the destination tile's sequence is.
1. Implement game creation event communications for online game.
1. Implement the scores/player-listing sidebar in __PlayScreen.
    - Also show scores (very small size) on top of player faces.
1. Display the operator's current sequence buffer.
1. Fill in implementation of bubble event handler.
1. Design decision: Change bubble mechanism:
    - Activates automatically and immediately upon players entering each others' (mutual) attack range, or by pressing space in the (mutual) attack range of other players.
    - When done automatically, health will be levelled-down enough to cause as many changes in downed-ness as possible by changing other opponents' health to -1 and teammates' health to 0.
    - If done by pressing space, health will be levelled further until the space-presser's health is at zero.
    - The player with the highest health upon contact, or the player who pressed space is considered the attacker.
      - If the attacker is downed (ie. everyone in the interaction is downed), no changes should be made. Just short circuit.
      - First, for each un-downed enemy (non-teammate) in range (sorted to evenly distribute downed-ness), the attacker will subtract that enemy's health+1 from its own, causing that enemy to become downed (health === -1 \< 0) until all enemies are downed, or any further whole-health-subtractions would cause it to become downed.
      - If it still has more health, it does something similar for its teammates.
1. Use webpack replace plugin to change some assertions and checks to only be done during development.

### Routine Checkups

- Check if there are any overridden setters without a getter also overridden or vice versa. This is a subtle and unexpected cause of bugs.

### Low Priority

- Play an emphasis animation on switching to a different operator, and dim non-current-operator faces.
- Use [this](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) with the .grid element to improve grid viewport. Scroll to center the current operator if it intersects with some rootMargin of the .grid element.
- Test performance when using `cloneNode` to create Tile elements versus all those calls to `document.createElement`.
  - [](https://developers.google.com/web/fundamentals/web-components)
- If we start using SASS, make classes that always have .center-contents or .stack-contents use an extension mechanism so we don't have to manually specify those utility classes in the javascript. That makes it easier to see whats happening from looking just at the stylesheets.
- [Create a mask-safe icon that is large enough (min 144px)](https://web.dev/maskable-icon/)
- Read about these topics and see how they might be useful
  - [](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Concepts_Behind_IndexedDB)
  - [](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
  - [](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_timing_API)
  - [](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen)
  - [](https://www.npmjs.com/package/bad-words)
  - Heroku
    - [](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
    - [](https://devcenter.heroku.com/articles/deploying-nodejs)
    - [](https://devcenter.heroku.com/articles/node-best-practices)
    - [](https://devcenter.heroku.com/articles/nodejs-support)
    - [](https://medium.com/deployplace/heroku-vs-docker-the-ultimate-comparison-with-hidden-pitfalls-revealed-f6b7f4075de5)
  - [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- Make a nicely styled console-log greeting on the client side.
  - List common variables in the program that they might like to look at.
- To discourage players from spamming the keyboard, which would make them move chaotically really fast and defeat the educational purpose of the game, detect their success rate of pressing relevant keys, or the rate in terms of time. If they seem to be spamming, then somehow throttle their requests. Maybe stop responding for a brief period of time.
- Look into switching from JsDoc to TsDoc
  - [eslint plugin](https://www.npmjs.com/package/eslint-plugin-tsdoc)
- [custom mouse images!](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Basic_User_Interface/Using_URL_values_for_the_cursor_property)

### Dependency Management

- Use es6 #private syntax for getter-backing fields
  - Waiting for eslint parser plugin: `https://github.com/typescript-eslint/typescript-eslint/pull/1465#issuecomment-591562659`
  - Turn eslint back on (the vscode extension) when the typescript parser for eslint is ready.
- WebPack 5:
  - `output.ecmaVersion` is `6` by default. If we have set it to `6` manually, we can delete the manual field specification.
- [TypeScript / tslib bug](https://github.com/microsoft/TypeScript/issues/36841)
  - This is on the roadmap for TypeScript 2.9.1... That may be a while.
  - When it is fixed, we can take out the ts-loader compiler option forcing `importHelpers` to be off.
- In package.json's scripts field, use node's `--enable-source-maps` flag when there is better support for it / we update node to a version with better support for it / I find out that there is good support and I was just using it wrong.

---

## Important Ideas to Develop

- Make sound settings stubs for playing music and sound effects.
  - make BGM have a track that varies with lang and different selectable style variations such as jazz cafe/elevator music, fast 13/8.
  - Make movement sound effects able to depend on translated key input like morse sounds.

## Good Reads

```text
https://javascript.info/class-inheritance
https://medium.com/better-programming/prototypes-in-javascript-5bba2990e04b
https://www.quirksmode.org/js/events_order.html#link4
https://www.mikedoesweb.com/2017/dynamic-super-classes-extends-in-es6/
https://javascript.info/mixins
https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Cross_browser_testing/JavaScript

https://github.com/whatwg/html/issues/4078

https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
```

## Research / Learning Links

### Licensing

```text
https://creativecommons.org/faq/#can-i-apply-a-creative-commons-license-to-software
https://www.gnu.org/licenses/copyleft.html
https://opensource.org/licenses
```

### Dynamic imports

Links no longer needed. Good things to know: both TypeScript and WebPack implement handling for dynamic imports. TypeScript will provide type information about the exports from a module, and WebPack will intercept the dynamic import to create a deferred-loading split chunk (A WebPack-internal mechanism).

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
https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
```

Presentation API:

- [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Presentation_API)
- [W3C](https://www.w3.org/TR/presentation-api)
- [Google Example](https://googlechrome.github.io/samples/presentation-api/)

### Audio

[AudioContextOptions](https://devdocs.io/dom/audiocontextoptions): I should make two separate contexts: one for the layered music optimized for playback and lower power consumption, and one for sound effects optimized for low latency.

When playing and pausing music, I can [fade it in and out](https://devdocs.io/dom/audioparam/exponentialramptovalueattime) and then pause and resume the audio context to save device power. Either that, or I can [apply a muffling effect](https://devdocs.io/dom/biquadfilternode) when paused.

For the background music track, I will have multiple layers. They will all be the same length, except for the main melody track that will be some whole-number multiple in length. For all the short ones, we can [load them up into mono buffers](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData) using the [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), and then combine all those buffers as channels in one [AudioBuffer](https://devdocs.io/dom/audiobuffer). That will be the buffer for a looping [AudioBufferSourceNode](https://devdocs.io/dom/audiobuffersourcenode). I connect that source node to a [ChannelSplitterNode](https://devdocs.io/dom/channelsplitternode), which passes each channel through a gain node, then joins them back into one node via [ChannelMergerNode](https://devdocs.io/dom/channelmergernode). Those fader-mixed tracks (channels) will be connected to some more stereo effects, and finally to the context output destination.

I should keep my audio loops as short as possible. Ie. Every audio file 4 measures long except the melody file which is maybe 12 measures long.

Here's [something fun I can do](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API) (but don't have to).

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
flex playground: https://codepen.io/enxaneta/full/adLPwv/
https://developers.google.com/web/updates/2018/01/paintapi
https://drafts.csswg.org/mediaqueries-5/#custom-mq
```

### ARIA

```text
https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles
https://a11yproject.com/checklist/
```

### ES6 modules in NodeJS

```text
https://stackoverflow.com/questions/45854169/how-can-i-use-an-es6-import-in-node
https://medium.com/@iamstan/typescript-es-modules-micheal-jackson-2040216be793
https://nodejs.org/api/esm.html#esm_enabling
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
