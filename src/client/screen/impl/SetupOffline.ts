import { Lang } from "defs/TypeDefs";
import { Coord } from "floor/Tile";
import type { Game } from "game/Game";

import { OmHooks, SkScreen } from "../SkScreen";
import { SetupScreen } from "./Setup";


type SID = SkScreen.Id.SETUP_OFFLINE;

/**
 *
 */
export class SetupOfflineScreen extends SetupScreen<SID> {

    protected _lazyLoad(): void {
        super._lazyLoad();
        this.baseElem.classList.add(OmHooks.Screen.Impl.SetupOffline.Class.BASE);
    }

    protected _abstractOnBeforeEnter(args: SkScreen.CtorArgs<SID>): Promise<void> {
        this.nextBtn.onclick = (ev) => {
            // TODO.design create ctorArgs from user presets.
            const ctorArgs = Object.assign({}, SetupOfflineScreen.DEFAULT_PRESET);
            (ctorArgs.langId as string) = this.langSel.confirmedOpt.desc.id;
            this.requestGoToScreen(SkScreen.Id.PLAY_OFFLINE, ctorArgs);
        };
        return Promise.resolve();
    }
}
export namespace SetupOfflineScreen {

    // TODO.impl If we keep this, use a recursive Object.freeze.
    // Currently not frozen to allow for easier testing.
    export const DEFAULT_PRESET = <Game.CtorArgs<Game.Type.OFFLINE,any>>{
        coordSys: Coord.System.EUCLID2,
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
            username:   "hello1",
            noCheckGameOver: false,
            familyArgs: { },
        }, {
            isALocalOperator: true,
            familyId:   <const>"HUMAN",
            teamId:     1,
            socketId:   undefined,
            username:   "hello2",
            noCheckGameOver: false,
            familyArgs: { },
        }, {
            isALocalOperator: false,
            familyId:   <const>"CHASER",
            teamId:     1,
            socketId:   undefined,
            username:   "chaser1",
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
            username:   "chaser2",
            noCheckGameOver: true,
            familyArgs: {
                fearDistance: 5,
                bloodThirstDistance: 7,
                healthReserve: 3.0,
                movesPerSecond: 2.0,
            },
        },],
    };
}
Object.freeze(SetupOfflineScreen);
Object.freeze(SetupOfflineScreen.prototype);
