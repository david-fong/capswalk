
# Source Code

One of the big design challenges for this project is to allow playing on or off-line. I like this challenge because it really demands designing a good function API and inheritance tree, which isn't a trivial task given an overview of what each piece of the picture needs to accomplish:

|                     Task                   | Offline | Server | Client |
|:-------------------------------------------|:-------:|:------:|:------:|
| Maintain the master copy of the game state | :heavy_check_mark: | :heavy_check_mark: | :heavy_multiplication_x: |
| Display the game state via the browser DOM | :heavy_check_mark: | :heavy_multiplication_x: | :heavy_check_mark: |
| Use network operations to exchange events  | :heavy_multiplication_x: | :heavy_check_mark: | :heavy_check_mark: |

The presence or absence of the network separates the locality / implementation of event lifestages:

- request
  - creation
  - sending
  - receipt
  - validation
  - response
- change
  - enactment
  - dissemination

## Wrestling with Latency

The network chasm adds unpredictable time delay to the event processing lifecycle. This presents a delightful challenge: We want each client's view of the game's state to follow that of the master copy of the game's state as closely as possible. Let me explain a little further:

### The Facts

- I have little to no control over the physical effects of network latency. I can only put measures in place to prevent contributing to unnecessary congestion.
- The central mechanism to this game requires that I design for tight synchronization between a player's view of the game's state and that of the master copy _in the player's positional vicinity_: Every movement a player makes is a response to their immediate surroundings, which in turn respond by evolving in their wake.
- Protocols in the tooling can help, but purposely leave specifics to us: SocketIO can only guarantee in-order transactions if the client is using websockets for its underlying transport, which- while common- is not a given. If I simply ignore/accept this, I run the risk of assertion-breaking corner cases where order-scrambled events reaching a client make it appear as though the game was entering an impossible state, such as having multiple players occupy the same tile.
- There is a tradeoff between pipelining a player's requests for movement, and with guarding their intent: Because of the need to handle CSP ambiguity (see [the language readme](./base/lang/readme.md)), the more movement requests we pipeline on the client side, the further we venture into risky territory where- by the time pipelined requests reach the server, their surroundings have changed in a way that no longer matches the original intent of the request.
- Running a NodeJS server means we can only process one incoming event at a time. Having this simplicity imposed upon us actually works in our favour!

### This Means

- The order of events will be considered as the order in which they are processed by the single-threaded NodeJS server, so our definition of "event reordering" is only possible for events as they travel to each client.
  - Ie. Reordering is only a problem for clients. We need an event ID system to detect event reordering and to gracefully handle the funky things that appear to happen as a result of it.
- There isn't a passably effective and dependable way to pipeline a player's requests for movement because we want to closely guard their intent as the game's state changes around them.
  - That's fine. We can bite this bullet.

The effect of these responses to the constraints is that we force each client to wait for each of their requests for movement to be responded to by the server before their make another request, but we pipeline everything else as it returns to the clients in a way that can handle out of order events.
