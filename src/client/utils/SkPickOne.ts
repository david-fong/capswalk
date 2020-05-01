import { OmHooks } from "defs/OmHooks";


/**
 *
 */
// TODO.learn https://www.w3.org/TR/wai-aria-1.1/#managingfocus
export abstract class SkPickOne<O extends SkPickOne.__Option> {

    public readonly baseElem: HTMLElement;

    protected readonly options: Array<O>;

    #confirmedOpt: O;
    #hoveredOpt: O;

    public constructor() {
        const baseElem = document.createElement("div");
        baseElem.tabIndex = 0;
        baseElem.addEventListener("keydown", this.onKeyDown.bind(this));
        this.baseElem = baseElem;
    }

    public addOption(opt: O): void {
        if (this.options.length === 0) {
            this.#hoveredOpt   = opt;
            this.#confirmedOpt = opt;
        }
        this.options.push(opt);
        this.baseElem.appendChild(opt.baseElem);
    }

    public hoverOpt(opt: O): void {
        if (this.hoveredOpt !== opt) {
            this.hoveredOpt.baseElem.toggleAttribute("aria-active-descendant", false);
            this.#hoveredOpt = opt;
            this.hoveredOpt.baseElem.toggleAttribute("aria-active-descendant", true);
        }
    }
    protected abstract __onHoverOpt(opt: O): void;

    public selectOpt(opt: O, doCallback: boolean = true): void {
        if (!opt) throw new Error("opt must be defined");
        // We must ensure hovering before executing confirmation:
        this.hoverOpt(opt);
        // Now that hovering is done, execute confirmation of selection:
        if (this.confirmedOpt !== opt) {
            this.confirmedOpt.baseElem.toggleAttribute("aria-selected", false);
            this.#confirmedOpt = opt;
            this.confirmedOpt.baseElem.toggleAttribute("aria-selected", true);
            if (doCallback) {
                this.__onSelectOpt(opt);
            }
        }
    }
    protected abstract __onSelectOpt(opt: O): void;

    public get confirmedOpt(): O {
        return this.#confirmedOpt;
    }
    public get hoveredOpt(): O {
        return this.#hoveredOpt;
    }

    private onKeyDown(ev: KeyboardEvent): boolean {
        if (ev.key === " " || ev.key === "Enter") {
            this.selectOpt(this.hoveredOpt);
            ev.preventDefault();
            return false;
        } else {
            const hoverOptIndex = this.options.indexOf(this.hoveredOpt);
            if (ev.key === "ArrowDown" || ev.key === "Down") {
                if (hoverOptIndex < (this.options.length - 1)) {
                    this.hoverOpt(this.options[hoverOptIndex + 1]);
                    ev.preventDefault();
                    return false;
                }
            } else if (ev.key === "ArrowUp" || ev.key === "Up") {
                if (hoverOptIndex > 0) {
                    this.hoverOpt(this.options[hoverOptIndex - 1]);
                    ev.preventDefault();
                    return false;
                }
            }
        }
        return true;
    }
}
export namespace SkPickOne {
    /**
     *
     */
    export abstract class __Option {
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
