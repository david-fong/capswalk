
# 📁 TypeDefs

This folder is a TypeScript sub-project containing basic type definitions. It is my solution to moving the folders "events", and "floor", to their own sub-projects away from the `Game` and `Player` classes and being able to use documented type aliases in all those sub-projects without having circular project references, which are currently [not supported in TypeScript](https://github.com/microsoft/TypeScript/issues/33685) or on any roadmap.

Documentation for scoped type aliases (ones merged into a class using namespace merging) will go to the extension where the type alias is exposed to the main code. Documentation on constants may go here, where it will be sought up the prototype chain of the class literal.
