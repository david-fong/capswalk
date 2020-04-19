import { OmHooks } from '../OmHooks';

/**
 *
 */
export abstract class Display {

    public baseElem: HTMLElement;

    protected constructor() {
        const baseElem = document.createElement("div");
        baseElem.classList.add(
            OmHooks.General.Class.FILL_PARENT,
        );
    }

}
