

/**
 *
 */
// TODO.impl use aria-selected (this is set after the user confirms selection of the active descendant)

import { OmHooks } from 'defs/OmHooks';

// TODO.learn https://www.w3.org/TR/wai-aria-1.1/#managingfocus
export abstract class SkPickOne<O extends SkPickOne.Option> {

    readonly #baseElem: HTMLElement;

    private readonly options: TU.NoRo<O>;

    #confirmedOption: O;
    #hoveredOption: O;



    public constructor() {
        const baseElem = document.createElement("div");
        baseElem.tabIndex = 0;
    }

    public select(opt: O): void {
        // We must ensure hovering before executing confirmation:
        if (this.hoveredOption !== opt) {
            this.hoveredOption.baseElem.toggleAttribute("aria-active-descendant", false);
            this.#hoveredOption = opt;
            this.hoveredOption.baseElem.toggleAttribute("aria-active-descendant", true);
        }
        // Now that hovering is done, execute confirmation of selection:
        if (this.confirmedOption !== opt) {
            this.confirmedOption.baseElem.toggleAttribute("aria-selected", false);
            this.#confirmedOption = opt;
            this.confirmedOption.baseElem.toggleAttribute("aria-selected", true);
        }
    }

    public get baseElem(): HTMLElement {
        return this.#baseElem;
    }
    public get confirmedOption(): O {
        return this.#confirmedOption;
    }
    public get hoveredOption(): O {
        return this.#hoveredOption;
    }
}
export namespace SkPickOne {
    /**
     *
     */
    export abstract class Option {
        public readonly baseElem: HTMLElement;
        public constructor() {
            this.baseElem = document.createElement("div");
            this.baseElem.classList.add(OmHooks.SkPickOne.Class.OPT_BASE);
        }
    }
    Object.freeze(SkPickOne);
    Object.freeze(SkPickOne.prototype);
}
Object.freeze(SkPickOne);
Object.freeze(SkPickOne.prototype);
