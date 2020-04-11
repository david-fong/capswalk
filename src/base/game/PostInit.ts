import { Coord } from "floor/Coord";
import { Grid } from "floor/Grid";
import { VisibleGrid } from "floor/VisibleGrid";

import { Euclid2 } from "floor/impl/Euclid2";
import { Beehive } from "floor/impl/Beehive";


/**
 * This function should be imported and run for each index.js file
 * for the TypeScript-Projects "offline", "client", and "server".
 *
 * This file serves the dual purpose of initializing implementation
 * registries _after_ implementations and their class hierarchy have
 * been defined, and of importing implementations so they don't get
 * tree-shaken-out by webpack.
 */
export function PostInit(): void {

    // Non-Visible Grid Implementation Registry:
    (Grid.__Constructors as {[S in Coord.System]: Grid.ClassIf<S>})
    = Object.freeze({
        [ Coord.System.EUCLID2 ]: Euclid2.Grid,
        [ Coord.System.BEEHIVE ]: Beehive.Grid,
    });

    // Visible Grid Implementation Registry:
    (VisibleGrid.__Constructors as {[S in Coord.System]: VisibleGrid.ClassIf<S>})
    = Object.freeze({
        [ Coord.System.EUCLID2 ]: Euclid2.Grid.Visible,
        [ Coord.System.BEEHIVE ]: Beehive.Grid.Visible,
    });
}