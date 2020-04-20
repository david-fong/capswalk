### Expected Behaviour

### Actual Behaviour

### Steps to Reproduce the Problem

I am using node v12.13.0. In the ts-loader options, I have made sure to set `transpileOnly` to false, and `compilerOptions.emitDeclarationOnly` to false.

1. Clone [my project](https://github.com/david-fong/SnaKey-NTS.git).
1. Switch to the `ts-loader-repro` branch.
1. Install node dependencies.
1. Run `./scripts/pack -t` (A shell script that builds my webpack config. I write my webpack config in typescript. Passing the `-t` option tells the shell script to transpile the webpack config to javascript).
1. Run the packing script again. This time, you do not need to pass `-t`.

#### Notable Files

- [`:/.templates/tsconfig.json`](https://github.com/david-fong/SnaKey-NTS/blob/ts-loader-repro/.templates/tsconfig.json): All my project-reference configs extend from this base config to avoid repetition.
- [`:/src/client/tsconfig.json`](https://github.com/david-fong/SnaKey-NTS/blob/ts-loader-repro/src/client/tsconfig.json): This is the top-level typescript config for the webpack entry being built.
- [`:/scripts/webpack.config.ts`](https://github.com/david-fong/SnaKey-NTS/blob/ts-loader-repro/scripts/webpack.config.ts#L73). This is my webpack config. See line 73 for the part related to ts-loader.

### Location of a Minimal Repository that Demonstrates the Issue.
