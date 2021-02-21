
# ⌨🐍 SnaKey

[**`Try it!` 👈**](https://david-fong.github.io/snakey3/)

This project is also [deployed on Heroku](https://snakey3.herokuapp.com/).

See the GitHub wiki page for info about this project's design challenges, its history, and the technologies and interesting techniques used in it.

## Contributing

Contributions and feedback are welcome! To get setup locally, follow the steps in [dev-guide.md](./dev-guide.md).

This project is currently in a weird state where the low-level foundations of the project are fairly established, but I'm undecided as to what the _game should be_. I'm planning to do some work with the architecture to enable multiple game modes.

### Suggested Contributions

- Game ideas are welcome! Existing game ideas are in [game-ideas.md](./game-ideas.md). Please read that file first to get an idea of what this project is aiming for. To suggest an idea, [start a new discussion](https://github.com/david-fong/snakey3/discussions/new) in the "ideas" category.
- Color schemes: For the format and examples, see [src/client/colours/](./src/client/colours).
- Implementing the [Beehive grid](./src/base/floor/impl/Beehive).
- Improvements to the build process- especially for WebPack watch mode and hot-reload. See [scripts/webpack/](./scripts/webpack). Feedback and suggestions here are very welcome as long as you start a PR to get the ball rolling.

## Licence

This project is licenced under the [PolyForm Noncommercial License 1.0.0](./LICENSE.md).
