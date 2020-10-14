import { Grid } from "floor/Grid";
import { VisibleGrid } from "floor/VisibleGrid";

import { Euclid2, Euclid2VisibleGrid } from "floor/impl/Euclid2";
import { Beehive, BeehiveVisibleGrid } from "floor/impl/Beehive";

import { ArtificialPlayer } from "./player/ArtificialPlayer";
import { Chaser } from "./player/artificials/Chaser";


/**
 * This function should be imported and run at the beginning of each
 * index.js file before calling any constructors for SnaKey-related
 * classes.
 *
 * It serves the dual purpose of initializing implementation
 * registries _after_ implementations and their class hierarchy have
 * been defined, and of importing implementations so they don't get
 * tree-shaken-out by webpack.
 */
export function _INIT_BASIC_CLASS_REGISTRIES(): void
{ {
    // Non-Visible Grid Implementation Registry:
    (<TU.NoRo<typeof Grid._Constructors>>Grid._Constructors)
    = Object.freeze({
        [ "EUCLID2" ]: Euclid2.Grid,
        [ "BEEHIVE" ]: Beehive.Grid,
    });
    Object.freeze(Grid);
    Object.freeze(Grid.prototype);
} {
    const AP = ArtificialPlayer;
    (<TU.NoRo<typeof AP._Constructors>>AP._Constructors)
    = Object.freeze({
        CHASER: Chaser,
    });
    Object.freeze(AP);
    Object.freeze(AP.prototype);
} }
Object.freeze(_INIT_BASIC_CLASS_REGISTRIES);


/**
 */
export function _INIT_CLIENTSIDE_CLASS_REGISTRIES(): void
{ {
    // Visible Grid Implementation Registry:
    const VGr = VisibleGrid;
    (<TU.NoRo<typeof VGr._Constructors>>VGr._Constructors)
    = Object.freeze({
        [ "EUCLID2" ]: Euclid2VisibleGrid,
        [ "BEEHIVE" ]: BeehiveVisibleGrid,
    });
    Object.freeze(VGr);
    // This is just an interface. There is no instance prototype to freeze.
} }
Object.freeze(_INIT_CLIENTSIDE_CLASS_REGISTRIES);