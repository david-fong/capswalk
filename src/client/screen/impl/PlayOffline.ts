import type { Coord }       from "floor/Tile";
import type { OfflineGame } from "../../game/OfflineGame";
import { Lang }             from "defs/TypeDefs";

import type { SkScreen } from '../SkScreen';
import { __PlayScreen } from "./Play";


/**
 *
 */
export class PlayOfflineScreen extends __PlayScreen<SkScreen.Id.PLAY_OFFLINE> {

    public readonly canBeInitialScreen = true;

    declare public readonly currentGame: OfflineGame<any> | undefined;

    /**
     * @override
     */
    protected readonly wantsAutoPause = true;

    /**
     * @override
     */
    protected __lazyLoad(): void {
        super.__lazyLoad();
    }

    /**
     * @override
     */
    protected async __createNewGame(): Promise<OfflineGame<any>> {
        // TODO.impl use game-setup args passed in from __abstractOnBeforeEnter
        return new (await import(
            /* webpackChunkName: "game/offline" */
            "../../game/OfflineGame"
        )).OfflineGame(this.__onGameBecomeOver.bind(this), {
            coordSys: "EUCLID2" as Coord.System.EUCLID2,
            gridDimensions: {
                height: 21,
                width:  21,
            },
            averageFreeHealthPerTile: 1.0 / 45.0,
            langBalancingScheme: Lang.BalancingScheme.WEIGHT,
            langId: "engl-low",
            playerDescs: [{
                isALocalOperator: true,
                familyId:   <const>"HUMAN",
                teamId:     0,
                socketId:   undefined,
                username:   "hello world 1",
                noCheckGameOver: false,
                familyArgs: { },
            }, {
                isALocalOperator: true,
                familyId:   <const>"HUMAN",
                teamId:     1,
                socketId:   undefined,
                username:   "hello world 2",
                noCheckGameOver: false,
                familyArgs: { },
            }, {
                isALocalOperator: false,
                familyId:   <const>"CHASER",
                teamId:     1,
                socketId:   undefined,
                username:   "chaser test 1",
                noCheckGameOver: true,
                familyArgs: {
                    fearDistance: 5,
                    bloodThirstDistance: 7,
                    healthReserve: 3.0,
                    movesPerSecond: 2.0,
                },
            }, {
                isALocalOperator: false,
                familyId:   <const>"CHASER",
                teamId:     1,
                socketId:   undefined,
                username:   "chaser test 2",
                noCheckGameOver: true,
                familyArgs: {
                    fearDistance: 5,
                    bloodThirstDistance: 7,
                    healthReserve: 3.0,
                    movesPerSecond: 2.0,
                },
            },],
        });
    }
}
Object.freeze(PlayOfflineScreen);
Object.freeze(PlayOfflineScreen.prototype);
