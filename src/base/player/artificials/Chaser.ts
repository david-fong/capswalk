import { Pos } from "src/Pos";
import { Game } from "src/base/Game";
import { PlayerId } from "src/base/player/Player";
import { ArtificialPlayer } from "src/base/player/ArtificialPlayer";


/**
 * 
 */
export namespace ArtificialPlayerTypes {

    export class Chaser extends ArtificialPlayer {

        public constructor(game: Game, idNumber: PlayerId) {
            super(game, idNumber);
        }

        /**
         * @override
         */
        protected computeDesiredDestination(): Pos {
            return undefined; // TODO
        }

        /**
         * @override
         */
        protected computeNextMovementTimer(): number {
            return undefined; // TODO
        }

    }

}
