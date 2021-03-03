
# Web User Interface

**`IMPORTANT`**: This TypeScript project-reference does not depend on anything except the defs project. This is important. In the WebPack configuration, we split this project into its own chunk so that it is all that is required for the initial page load. The game code can then be lazily loaded. This will speed up the initial page load of the home screen.

As a TypeScript project, this will have minimal dependencies. It will present a bunch of hooks for the rest of the game code to connect itself to. It will mainly be the case that other higher-level projects depend on this one.

## UI by location

### Player Options

These should be able to be changed at any time: on the homepage, or during a game via sidebar.

- avatar
- colour scheme
- sound settings
  - background music volume
  - sound effects volume

Make all settings available to all clients, and leave it to GameSession / Game Manager to decide how to respond.

- (ie, execute privileged-only change if requester is privileged client,
- And broadcast how the request was handled:
  - "lang change made by _username_ will take effect in the next game"
  - Or "_username_ requested a game-pause" or "_username_ paused the game")
