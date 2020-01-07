import { Player } from "utils/TypeDefs";
import { Coord as BaseCoord } from "../Coord";


/**
 * 
 */
export namespace __Bench {
    type B = Coord.Bare;
    type S = BaseCoord.System.__BENCH;

    /**
     * NOTE: unlike other implementations, this one's class literal
     * is exported. This is because it needs to be instantiated
     * directly.
     */
    export class Coord extends BaseCoord.Abstract<S> implements B {

        public readonly playerId: Player.Id;

        public constructor(desc: B) {
            super(desc);
            this.playerId = desc.playerId;
            Object.freeze(this);
        }

    }

    export namespace Coord {
        export type Bare = Readonly<{
            playerId: Player.Id;
        }>;
    }

    // NOTE: no grid implementation.

}