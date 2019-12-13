import { Pos } from "src/Pos";
import { Game } from "src/base/Game";
import { Player } from "src/base/player/Player";
import { ArtificialPlayer } from "src/base/player/ArtificialPlayer";


/**
 * 
 * @extends ArtificialPlayer
 */
export namespace ArtificialPlayerTypes {

    export class Chaser extends ArtificialPlayer {

        public static readonly TEAM_NUMBER = -1;

        protected constructor(game: Game, desc: Player.CtorArgs) {
            super(game, desc);
        }

        /**
         * @override
         */
        protected computeDesiredDestination(): Pos {
            return undefined!; // this.game.allHumanPlayers; // TODO
        }

        /**
         * @override
         */
        protected computeNextMovementTimer(): number {
            return undefined!; // TODO
        }

    }

}
