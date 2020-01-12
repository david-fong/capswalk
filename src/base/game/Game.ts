import { Lang } from "lang/Lang";
import { BalancingScheme } from "lang/LangSeqTreeNode";

import { Coord, Tile } from "floor/Tile";
import { Grid } from "floor/Grid";

import { Player } from "./player/Player";

import { GameEvents } from "./__gameparts/Events";
import { PuppetPlayer } from "game/player/PuppetPlayer";


/**
 * 
 * 
 * This class performs the majority of management over {@link Tile}
 * and {@link Player} objects. As a design choice, players can only join
 * a game before it starts, and actions such as changing the language or
 * difficulty require a restart. These actions that require a restart will
 * all be exposed to operators through a pre-game page. Other such actions
 * include: changing teams.
 * 
 * An overview of subclasses:
 * Both {@link ClientGame} and {@link OfflineGame} use {@link VisualTile}s
 * while {@link ServerGame} uses {@link ServerTile}s. {@link ClientGame}'s
 * record of the state of the game comes completely from {@link ServerGame}.
 * 
 * There are overlaps between what each implementation needs to do:
 * - Offline and Server games maintain and control the master-game-state.
 * - Offline and Client games display the game-state to an operator via browser and HTML.
 * - Client  and Server games use network operations to communicate.
 */
export abstract class Game<G extends Game.Type, S extends Coord.System.GridCapable> extends GameEvents<G,S> {

    /**
     * @override
     */
    protected createHumanPlayer(desc: Player.CtorArgs): PuppetPlayer<S> {
        return new PuppetPlayer(this, desc);
    }

}



export namespace Game {

    export const enum Type {
        OFFLINE = "OFFLINE",
        SERVER  = "SERVER",
        CLIENT  = "CLIENT",
    }
    export namespace Type {
        export type Manager = Type.OFFLINE | Type.SERVER;
    }

    /**
     * # Game Constructor Arguments
     * 
     * @template S
     * The coordinate system to use. The literal value must also be
     * passed as the field {@link CtorArgs#coordSys}.
     */
    export type CtorArgs<
        G extends Game.Type,
        S extends Coord.System.GridCapable,
    > = Readonly<{
        gameType: G;
        coordSys: S;

        gridDimensions: Grid.Dimensions<S>;
        languageName: typeof Lang.Modules.NAMES[number];
        langBalancingScheme: BalancingScheme;

        /**
         * The index in `playerDescs` of the operator's ctor args.
         */
        operatorIndex: G extends Game.Type.SERVER
            ? typeof Player.Id.NULL
            : Player.Id["intraClassId"];
        playerDescs: Player.Bundle<Player.CtorArgs>;
    }>;

    export namespace CtorArgs {

        export const EVENT_NAME = "game-create";

        /**
         * Not used here, but used in {@link GroupSession#createGameInstance}.
         */
        export type FailureReasons = Partial<{
            undefinedUsername: Array<Player.SocketId>; // socket ID's
        }>;
    }

}
