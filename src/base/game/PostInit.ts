import { Coord } from "floor/Coord";
import { Grid } from "floor/Grid";
import { VisibleGrid } from "floor/VisibleGrid";

import { Euclid2 } from "floor/impl/Euclid2";
import { Beehive } from "floor/impl/Beehive";

import { ArtificialPlayer } from "game/player/ArtificialPlayer";
import { Chaser } from "game/player/artificials/Chaser";


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
    (<TU.NoRo<typeof Grid.__Constructors>>Grid.__Constructors)
    = Object.freeze({
        [ Coord.System.EUCLID2 ]: Euclid2.Grid,
        [ Coord.System.BEEHIVE ]: Beehive.Grid,
    });
    Object.freeze(Grid);
    Object.freeze(Grid.prototype);

    // Visible Grid Implementation Registry:
    (<TU.NoRo<typeof VisibleGrid.__Constructors>>VisibleGrid.__Constructors)
    = Object.freeze({
        [ Coord.System.EUCLID2 ]: Euclid2.Grid.Visible,
        [ Coord.System.BEEHIVE ]: Beehive.Grid.Visible,
    });
    Object.freeze(VisibleGrid);
    // This is just an interface. There is no instance prototype to freeze.

    (<TU.NoRo<typeof ArtificialPlayer.__Constructors>>ArtificialPlayer.__Constructors)
    = Object.freeze({
        CHASER: Chaser,
    });
    Object.freeze(ArtificialPlayer);
    Object.freeze(ArtificialPlayer.prototype);
}
Object.freeze(PostInit);