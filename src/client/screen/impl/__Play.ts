import { OmHooks } from "defs/OmHooks";
import type { GameBase } from "game/__gameparts/Base";
import type { OfflineGame } from "../../game/OfflineGame";
import type { OnlineGame }  from "../../game/OnlineGame";

import { SkScreen } from "../SkScreen";

type Game = (OfflineGame<any> | OnlineGame<any>);

/**
 *
 */
export abstract class __PlayScreen extends SkScreen {

    protected readonly gridElem: HTMLElement;

    #currentGame: Game | undefined;

    protected __lazyLoad(): void {
        const centerColElem = document.createElement("div");
        centerColElem.classList.add(
            OmHooks.Screen.Impl.PlayGame.Class.GRID_CONTAINER,
            OmHooks.General.Class.CENTER_CONTENTS,
        );
        {
            const gridElem = document.createElement("div");
            gridElem.tabIndex = 0; // <-- allow focusing this element.
            gridElem.classList.add(
                OmHooks.Grid.Class.GRID,
                OmHooks.General.Class.TEXT_SELECT_DISABLED,
                OmHooks.General.Class.CENTER_CONTENTS,
                OmHooks.General.Class.STACK_CONTENTS,
            );
            gridElem.onkeydown = (ev): boolean => {
                // console.log(`key: ${ev.key}, code: ${ev.code},`
                // + ` keyCode: ${ev.keyCode}, char: ${ev.char},`
                // + ` charCode: ${ev.charCode}`);
                this.currentGame?.currentOperator.processKeyboardInput(ev);
                // Disable scroll-down via spacebar:
                if (ev.keyCode === 32) {
                    ev.preventDefault();
                    return false;
                }
                return true;
            };
            {
                // Add a "keyboard-disconnected" overlay if not added already:
                const kbdDcBase = document.createElement("div");
                kbdDcBase.classList.add(
                    OmHooks.Grid.Class.KBD_DC_BASE,
                    OmHooks.General.Class.CENTER_CONTENTS,
                );
                // TODO.impl Add an <svg> with icon instead please.
                {
                    const kbdDcIcon = document.createElement("div");
                    kbdDcIcon.classList.add(OmHooks.Grid.Class.KBD_DC_ICON);
                    kbdDcIcon.innerText = "(click here to continue typing)";
                    kbdDcBase.appendChild(kbdDcIcon);
                }
                gridElem.appendChild(kbdDcBase);
            }
            (this.gridElem as HTMLElement) = gridElem;
            centerColElem.appendChild(gridElem);
        }
        this.baseElem.appendChild(centerColElem);
    }

    protected __abstractOnBeforeEnter(): void {
    // TODO.design Are there ways we can share more code between
    // implementations by passing arguments?
        this.__createNewGame().then((game) => {
            this.#currentGame = game;
            // console.log(this.currentGame);
            // console.log(this.currentGame!.lang.simpleView());
            this.statusBecomePlaying();
        });
    }

    public get currentGame(): Game | undefined {
        return this.#currentGame;
    }

    protected abstract async __createNewGame(): Promise<Game>;

    protected destroyCurrentGame(): void {
    }

    // TODO.impl bind this to a button and, for offline games, also
    // to an event listener called when the page loses focus.
    private statusBecomePlaying(): void {
        this.currentGame?.statusBecomePlaying();
        this.gridElem.focus();
    }

}
Object.freeze(__PlayScreen);
Object.freeze(__PlayScreen.prototype);
