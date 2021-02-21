
# Game Ideas

Maybe I should just rename this repo to "typing-game"... :P

## Points of Consideration

Simplicity is a high priority. See examples below.

- What is the pacing/intensity like?
- Is it singleplayer/multiplayer-only? An idea that works with both is encouraged.
  - For multiplayer games, is the nature of the game competitive or collaborative?
    - Collaborative games are probably more beginner-friendly.
- How long will the average game last?
- Bonus points for using the typing mechanics in some special way.
- Would you be willing to spearhead the implementation?
- Would the implementation likely require any significant changes to the _underlying_ mechanics?

## Endorsed Ideas

### Death Scroller

This idea scores high on simplicity points.

- The floor is rising lava. Keep moving up and see how long you survive.

### Weird Hangman Variant

This idea is somewhat simple.

- Everybody is running around except for one person.
- That one person is in a separate space with regular WASD-type movement.
  - They have a phrase they need to get everyone else to guess as fast as possible.
  - They must press the number of a player ID when that player is over the letter of the space that they are over.
  - If successful, that space will be revealed to the rest of the players, thus making it easier for them to guess what letters they should suggest for the revealer.
- The aim of the game is to reveal the phrase as fast as possible.

### Soccer

This idea is not very simple.

- Can hold and shoot a ball.
- For each step you take with the ball, you will stay frozen after losing it until the next people who pick it up have moved that many steps with the ball.
- For each step you take with the ball, the radius that it can be stolen from by an enemy team member increases.
