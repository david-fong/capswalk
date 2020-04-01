
# Brainstorming Pause Implementation

2020/03/30

Pausing is a boolean that is always true when the game is over. In extreme brevity, the main behaviour defining my usage the word "pause" is: Things stop moving.

While paused, the back-end should reject certain requests like requests for player movement and player bubble-making. It should also cancel certain kinds of periodic events such as artificial player movement.

At the same time, when paused, the front-end should short-circuit (return immediately) inside certain device-input handlers (which might otherwise send an event request to the game manager) to prevent unnecessary spam to the server.

In order to play nice with any behaviours dependent on how long the game has lasted, such time-tracking fields must account for pause-time by omitting it from duration tracking.

## Responsibility Overview

Behaviours dependent on game-state: A game should be automatically un-paused upon reset. Requests to pause the game when it is over should be immediately rejected.

(per implementation):

### Offline

- Request vectors (listen for): html button, keyboard, webpage-leave.
- Enact changes directly (no network communications required).
- Must render changes to web UI.

### Client

- Request vectors (listen for): html button, keyboard.
- Cannot enact changes - must go through server.
- `<network communications here>`
- Must react at any time to changes to pause-state ruled by server.
- Must render changes to web UI.

### Server

- Request vectors (listen for): socket.io event.
- Note: it is not necessary to respond to a request that I reject.
- Enact changes.
- Send new pause state over network to clients.

## Responsibility Elaboration

### Request Vectors

These listener functions must either be bound to an object that gets garbage collected with a dead Game instance, or they must be manually de-registered when a Game object will no longer be used. An example of this would be [`document.onvisibilitychange`](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API).

### Web UI Changes

These changes should be enacted upon changing to the paused state.

The HTML element for the game's grid should be greyed out.

### Enact changes

Player classes are responsible to check whether the game is over or paused- but this is only as a measure to reduce wasted event messaging. The most important thing is that the game manager must either reject or ignore client requests for game-in-session-actions. I need to make a decision on which way to go for that. If I go with ignoring (reduced traffic!), I need to make sure that clients clear all their `requestInFlight` flags when notified of the game becoming un-paused. The fact that players perform the game-over/game-paused checks.
