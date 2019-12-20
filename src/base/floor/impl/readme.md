
# Flooring Implementation Guidelines

For the following guideines, [`Euclid2`](./Euclid2.ts) can be used as a reference.

Each implementation must:

- Declare an enum mapping to a unique, readable string in [`Coord.System`](../Coord.ts).
- Extend `Coord`, passing the enum from the previous step as the only type parameter.
- Implement its own `Bare` type.
