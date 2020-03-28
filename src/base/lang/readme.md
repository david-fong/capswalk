
# Language Representation

The design and implementation of languages has been- unsurprisingly- led by what it is intended to contribute to the bigger picture.

At any time, a player is on a tile, and each adjacent tile is marked by a written character from the chosen language setting. For any tile, there are other tiles to which an occupant can reach (destsFrom), and other from which it can be reached (sourcesTo).

Each written character has a single keyboard-typeable sequence by which the player can communicate an intention to move to that tile. This is important to understand: The written character _visually_ marks a tile, but it is through the corresponding typeable sequence that a player _physically addresses_ that tile.

Since the sequence may be composed of multiple typeable-letters, for each player, there is a small buffer of previously typed keys which have yet to complete the sequence marking a dest-from tile. If the player's next input completes the sequence marking an unoccupied destination tile, the buffer is cleared, and the player moves to occupy that tile. If the next input contributes to a possible future completion, the input is pushed to the buffer and the player does not move. Otherwise, the whole buffer is cleared and the player does not move. In other words, the player's input buffer always forms part of the completion of a destination tile's sequence.

## Avoiding Ambiguities

In terms of the implementation, the typeable sequence is of more interest that the written character because of the constraint it requires when populating tiles with charseq (written-character-to-typeable-sequence) pairs (CSP's for short). During the initial construction / reset procedure of a game, all tiles are unmarked by CSP's. There are certain goals when marking tiles with CSP's: For one thing, randomness is always a goal. For that reason, I call the act of marking a tile with a CSP a "shuffle-in". Let me illustrate the problems a naive solution would encounter when performing shuffle-ins:

### Common-Prefix Ambiguity

```text
.----
|
|
|
'----
```

### Completely-Equal Ambiguity

```text
.----
|
|
|
'----
```

### Where I draw the line

For every version of this game, my decision has always been the same (although the way I implement that requirement continually improves)- to draw the line hard and early in the sand: At any time, for each tile in the game, it must be true that the sequences marking any destination tiles do not create any possibility for ambiguities. Specifically, it must be impossible for it to ever occur that a player's next sequence buffer could be a prefix of several destination tiles' marking CSP's. I think for the reasons above that this makes for a much better player experience- something they will enjoy, but perhaps never even notice.

## Effective Shuffling with Trees

searching by leaves

## Language Size Requirements

the number 24
