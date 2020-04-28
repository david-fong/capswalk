import { OmHooks } from "defs/OmHooks";
import type { Coord }       from "floor/Tile";
import type { OfflineGame } from "../../game/OfflineGame";
import { Lang }             from "defs/TypeDefs";

import { __PlayScreen } from "./__Play";


/**
 *
 */
export class PlayOfflineScreen extends __PlayScreen {

    declare public readonly currentGame: OfflineGame<any> | undefined;

    protected __lazyLoad(): void {
        super.__lazyLoad();
    }

    protected async __createNewGame(): Promise<OfflineGame<any>> {
        return new (await import("../../game/OfflineGame")).OfflineGame({
            gridElem: this.gridElem,
        }, {
            coordSys: "EUCLID2" as Coord.System.EUCLID2,
            gridDimensions: {
                height: 21,
                width:  21,
            },
            averageFreeHealthPerTile: 1.0 / 45.0,
            langBalancingScheme: Lang.BalancingScheme.WEIGHT,
            languageName: "engl-low",
            playerDescs: [
                {
                    isALocalOperator: true,
                    familyId:   <const>"HUMAN",
                    teamId:     0,
                    socketId:   undefined,
                    username:   "hello world",
                    noCheckGameOver: false,
                    familyArgs: { },
                }, {
                    isALocalOperator: false,
                    familyId:   <const>"CHASER",
                    teamId:     1,
                    socketId:   undefined,
                    username:   "chaser test",
                    noCheckGameOver: true,
                    familyArgs: {
                        fearDistance: 5,
                        bloodThirstDistance: 7,
                        healthReserve: 3.0,
                        movesPerSecond: 2.0,
                    }
                }
            ],
        });
    }

    protected destroyCurrentGame(): void {
        super.destroyCurrentGame();
    }

}
Object.freeze(PlayOfflineScreen);
Object.freeze(PlayOfflineScreen.prototype);
