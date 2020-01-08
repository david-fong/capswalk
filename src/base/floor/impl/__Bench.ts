import { Player } from "utils/TypeDefs";
import { Coord as BaseCoord } from "../Coord";


/**
 * 
 */
export namespace __Bench {

    type S = BaseCoord.System.__BENCH;

    /**
     * 
     */
    export class Coord extends BaseCoord.Abstract<S> implements Coord.Bare {

        public readonly playerId: Player.Id;

        public constructor(desc: Coord.Bare) {
            super(desc);
            this.playerId = desc.playerId;
            Object.freeze(this);
        }

        /**
         * @override
         */
        public equals(other: Coord.Bare): boolean {
            return (this.playerId === other.playerId);
        }

    }

    export namespace Coord {
        export type Bare = Readonly<{
            playerId: Player.Id;
        }>;
    }

    // NOTE: no grid implementation.

}