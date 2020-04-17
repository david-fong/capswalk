
# Web User Interface

As a TypeScript project, this will have minimal dependencies. It will present a bunch of hooks for the rest of the game code to connect itself to. It will mainly be the case that other higher-level projects depend on this one.

## UI by location

- homepage: choose from:
  on mouseover, show description
  - play offline: go to settings
  - play online: redirect to server
  - join LAN party: prompt for ip address
  - how to host LAN party
- settings:
  for server, this is also the place where people join and leave.
  [q] means this property is synced in the page url's query part.
  - [q] language
  - [q] lang balancing
  - [q] grid dimensions
  - [q] bots
  - [q] bot speed
  - avatar
  - multiplayer-only settings:
    - privileged (can pause)
    - username
    - team number
- game:
  [c] means this property can be saved as a cookie.
  - [c] color scheme
  - pause: restart
  - quit to settings
  - [c] mute: volume control
