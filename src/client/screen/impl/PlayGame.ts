import { SkScreen } from "../SkScreen";
import { OmHooks } from 'defs/OmHooks';


/**
 *
 */
export class PlayGameScreen extends SkScreen {

    protected __lazyLoad(): void {
        const centerColElem = document.createElement("div");
        centerColElem.classList.add(
            OmHooks.Screen.Impl.PlayGame.Class.GRID_CONTAINER,
            OmHooks.General.Class.CENTER_CONTENTS,
        );
        const gridElem = document.createElement("div");
        gridElem.classList.add(
            OmHooks.Grid.Class.GRID,
        );
        centerColElem.appendChild(gridElem);

        this.baseElem.appendChild(centerColElem);
    }

}
Object.freeze(PlayGameScreen);
Object.freeze(PlayGameScreen.prototype);
