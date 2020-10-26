import { VisibleGrid } from "floor/VisibleGrid";
import { Euclid2VisibleGrid } from "floor/impl/Euclid2";
import { BeehiveVisibleGrid } from "floor/impl/Beehive";

{
    // Visible Grid Implementation Registry:
    const VGr = VisibleGrid;
    (<TU.NoRo<typeof VGr._Constructors>>VGr._Constructors)
    = Object.freeze({
        [ "EUCLID2" ]: Euclid2VisibleGrid,
        [ "BEEHIVE" ]: BeehiveVisibleGrid,
    });
    Object.freeze(VGr);
    // This is just an interface. There is no instance prototype to freeze.
}