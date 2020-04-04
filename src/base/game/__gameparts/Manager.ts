import { Game } from "game/Game";
import type { Coord } from "floor/Tile";

import { GameEvents } from "game/__gameparts/Events";


export abstract class GameManager<G extends Game.Type, S extends Coord.System> extends GameEvents<G,S> {

}
