
# 🤖 Robot Player Implementations

```txt
@ src/base/game/player/robots
```

This is a folder for all implementations of the abstract `RobotPlayer` class.

Each implementation must:

- Set their constructor visibility to `protected`.
- Use the exact same constructor signature as that of the superclass.
- Declare an enum entry in [`Player.Operator`](../Player.ts).
  - Map that entry to their constructor function in the dictionary [`RobotPlayer._Constructors`](../../PostInit.ts).
- Declare custom behaviour arguments as an exported type.
  - Add a mapping to that type in the dictionary [`RobotPlayer.FamilySpecificPart`](../RobotPlayer.ts).
