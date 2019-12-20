
# Notes on TypeScript Configuration

One of the first things to know about TypeScript's compiler is that is does not modify the paths you specify for module imports no matter what module system or whether the import is relative, non-relative, or absolute. That is the job of a packager like WebPack. Fields in the configuration files passed to TypeScript's compiler are used to inform it of where to find things so it can perform checks such as type checks. Your packager, which will modify your import paths to a form consumable by the target module loading system such as that of Node or EcmaScript.

Note: when I write commands, I will exclude the command name, "tsc" or "npx tsc".

# Paths

Relative paths are relative to the directory containing the configuration file that defines the field with a relative path. This is important when using configuration inheritance. If a config file `child` directly extends another config file `parent` and `parent` defines `baseUrl` and `child` does not override it, then no matter where `child` is, it will take on the value of `parent`'s `baseUrl` after it is resolved relative to the directory containing `parent` and NOT relative to the directory containing `child`.

# baseUrl, rootDir, and outDir

The `baseUrl` field is used with `paths` for resolution of non-relative imports. all paths specified in `paths` mappins are relative to `baseUrl`. If `moduleResolution` is set to `node` for the config including some file `somefile.ts`, the TypeScript compiler will first try to resolve a non-relative import in `somefile.ts` against patterns matched by `paths`, then against `baseUrl`, then according to the NodeJS module resolution strategy.

`rootDir` and `outDir` are used to control where the transpiled files are emitted to. Specifically, the output directory of an input file is equal to (Note: I'm actually not sure about this. I haven't tested it or looked at the source code, but I've read most of the documentation several times and tried it out for myself a little):

- The absolute path to the first config file up an inheritance chain (where the last-overriden values of the input-file inclusion fields include the file) that has an `outDir` field.
  - Resolving that same config file's `outDir` field.
    - Resolving the relative path between the directory containing the input file and the value of the last-overridden `rootDir` field resolved relative to the directory containing the config file with that field.

If `rootDir` is specified, it must be an ancestor of all included input files (specified according to the `include`, `files`, and `exclude`, and `references` fields).

If the `rootDir` field is unspecified (after configuration inheritence is taken into consideration),

- If the `composite` field is set to `true`, then , the value `"."` will be used as a default.
- Otherwise, TypeScript will use the most specific directory that contains all included input files. For me, this is not desired behaviour. I would rather set this field and deal with compilation errors resulting from folder restructuring than allow the possibility that I overlook a change in the output structure due to this subtlety.

## Project References

Project references do multiple things: They allow you to enforce stronger modularity in your project by dividing it into nestable sub-projects where you can control which sub-project depends on which other sub-project, and specify different compiler flags for each sub-project. It also enables you to use a new mode of compilation that caches build info to avoid unnecessary recompilations.

The mechanics are not incredibly intuitive, and it may take significant effort to set up for the first time or migrate to. As an absolute beginner, I can say that it has been pretty frustrating, but not unreasonable, and has actually made me improve the way I structure my project.

Note: the "references" field will not be inherited from a parent configuration file.

When using nested project sub-projects with ESLint, make sure to ignore the pattern `tsconfig.json` in your `:/.eslintignore`, and reference only all of the leaf configurations in the root `eslintrc`.

## Useful Commands for Config Debug

| Arguments | Invoke From | Behaviour and Purpose |
|:---------:|:-----------:|-----------------------|
| `--help` | anywhere | list common command arguments and brief descriptions. For a full list of command arguments, see the [official documentation](https://www.typescriptlang.org/docs/handbook/compiler-options.html). |
| `--showConfig --project <path/to/some/config.json>` | anywhere | |
| `--build --listEmittedFiles` | A project folder (one containing a file named "tsconfig.json"). | Perform an incremental build and list the files emitted for each sub-project. |
