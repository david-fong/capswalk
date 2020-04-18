
# Web User Interface

As a TypeScript project, this will have minimal dependencies. It will present a bunch of hooks for the rest of the game code to connect itself to. It will mainly be the case that other higher-level projects depend on this one.

## UI by location

### homepage: choose from

on mouseover, show description

- play offline: go to settings
- play online: redirect to server
- join LAN party: prompt for ip address
- how to host LAN party

### Game Options

These are settings for the next game. All these options can be specified in the query part of a URL as an object. Users should be able to save named configurations (use the WebStorage API). One default configuration, "last used", will be automatically maintained by the javascript.

- language
- lang balancing
- coordinate system
  - grid dimensions
- bots (how many of what types)
- bot speed

### Multiplayer Joiner

__Per-user__ options in the joiner phase of a multiplayer game (after game options have been chosen).

- privileged (can pause)
- username
- team number

### Player Options

These should be able to be changed at any time: on the homepage, or during a game via sidebar.

- avatar
- colour scheme
- sound settings
  - background music volume
  - sound effects volume

### Game Controls

- pause or restart
- quit to settings
