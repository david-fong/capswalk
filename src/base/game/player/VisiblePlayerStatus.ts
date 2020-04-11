import { HtmlHooks } from "utils/HtmlHooks";
import type { Coord } from "floor/Tile";
import type { Player } from "./Player";
import { PlayerStatus } from "./PlayerStatus";


// TODO.impl make the overridden setters modify the HTML elements to
// visually indicate the changes.
export class VisiblePlayerStatus<S extends Coord.System> extends PlayerStatus<S> {

    public readonly playerDivElem: HTMLDivElement;

    public constructor(player: Player<S>) {
        super(player);
        {
            // TODO.design create a spotlight mask using the below CSS properties:
            // https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode
            const pDiv: HTMLDivElement = document.createElement("div");
            pDiv.className = HtmlHooks.Player.Class.BASE;
            this.playerDivElem = pDiv;
        }
    }


    public set score(newValue: Player.Health) {
        super.score = newValue;
    }

    public set health(newHealth: Player.Health) {
        super.health = newHealth;
        // TODO.design CSS integration for Player.isDowned rendering.
        // this.playerDivElem.dataset[HtmlHooks.Player.Dataset.IS_DOWNED] = this.isDowned;
    }

}
Object.freeze(VisiblePlayerStatus.prototype);
