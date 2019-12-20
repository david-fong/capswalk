
# 🤖 Artificial Player Implementations

```txt
@ src/base/game/player/artificials
```

This is a folder for all implementations of the abstract `ArtificialPlayer` class.

Each implementation must:

- Use the exact same constructor signature as that of their superclass.
- Declare an enum entry in [`Player.Operator`](../Player.ts).
- Map that entry to their constructor in the [`ArtificialPlayers.Constructors` dictionary](../ArtificialPlayer.ts).
