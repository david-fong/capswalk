
# 🤖 Artificial Player Implementations

```txt
@ src/base/player/artificials
```

This is a folder for all implementations of the abstract `ArtificialPlayer` class.

Each implementation must:

- Declare itself under the namespace `"ArtificialPlayerTypes"`.
- Use the exact same constructor signature as that of their superclass.
- Declare a static constant `"TEAM_NUMBER: Player.TeamNumber"` following [that type's rules](../Player.ts).
- Map the above constant to their own class literal in the [`ArtificialPlayers.Constructors` map-object](../ArtificialPlayer.ts).
