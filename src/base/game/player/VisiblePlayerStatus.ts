import { WebHooks } from "../../../webui/WebHooks";
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
            const pDiv = document.createElement("div");
            pDiv.className = WebHooks.Player.Class.BASE;
            pDiv.classList.add(WebHooks.General.Class.FILL_PARENT);
            this.playerDivElem = pDiv;
        } {
            // Setup downedOverlay element:
            const doDiv = document.createElement("div");
            doDiv.className = WebHooks.Player.Class.DOWNED_OVERLAY;
            doDiv.classList.add(WebHooks.General.Class.FILL_PARENT);
            this.playerDivElem.appendChild(doDiv);
        }
    }


    public set score(newValue: Player.Health) {
        super.score = newValue;
    }

    public set health(newHealth: Player.Health) {
        super.health = newHealth;

        // CSS integration for Player.isDowned rendering.
        if (this.isDowned) {
            this.playerDivElem.dataset[WebHooks.Player.Dataset.DOWNED] = "has-attr";
        } else {
            delete this.playerDivElem.dataset[WebHooks.Player.Dataset.DOWNED];
        }
    }
}
Object.freeze(VisiblePlayerStatus);
Object.freeze(VisiblePlayerStatus.prototype);
