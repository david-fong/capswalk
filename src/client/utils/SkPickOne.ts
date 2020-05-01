import { OmHooks } from "defs/OmHooks";


/**
 * Consumers and implementers of this utility widget must ensure that
 * a call to `selectOpt` is made with valid arguments before it becomes
 * interfaceable to a browser user.
 */
// TODO.learn https://www.w3.org/TR/wai-aria-1.1/#managingfocus
export abstract class SkPickOne<O extends SkPickOne.__Option> {

    public readonly baseElem: HTMLElement;

    protected readonly options: Array<O>;

    #confirmedOpt: O;
    #hoveredOpt: O;
    #validity: boolean;

    public constructor() {
        const baseElem = document.createElement("div");
        baseElem.tabIndex = 0;
        baseElem.addEventListener("keydown", this.onKeyDown.bind(this));
        this.baseElem = baseElem;
    }

    public addOption(opt: O): void {
        this.options.push(opt);
        this.baseElem.appendChild(opt.baseElem);
        opt.__registerParent(this.onOptDisabledChange.bind(this));
    }

    public hoverOpt(opt: O): void {
        if (this.hoveredOpt !== opt) {
            // nullish coalesce is for edge-case on adding first option.
            this.hoveredOpt?.baseElem.toggleAttribute("aria-active-descendant", false);
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
            // nullish coalesce is for edge-case on adding first option.
            this.confirmedOpt?.baseElem.toggleAttribute("aria-selected", false);
            this.#confirmedOpt = opt;
            this.confirmedOpt.baseElem.toggleAttribute("aria-selected", true);
            if (doCallback) {
                this.__onSelectOpt(opt);
            }
        }
    }
    /**
     * When selecting an option makes changes to other elements,
     * implementations should see the aria attributes `aria-controls`
     * and `aria-describes`.
     */
    protected abstract __onSelectOpt(opt: O): void;

    public get confirmedOpt(): O {
        return this.#confirmedOpt;
    }
    public get hoveredOpt(): O {
        return this.#hoveredOpt;
    }

    private onOptDisabledChange(opt: O): void {
        if (this.confirmedOpt === opt) {
            this.validity = !opt.disabled;
        }
    }

    private set validity(newValidity: boolean) {
        if (this.validity !== newValidity) {
            this.baseElem.setAttribute("aria-invalid", (newValidity ? "false": "true"));
            this.#validity = newValidity;
            // TODO.impl styling.
        }
    }

    // TODO.impl skip disabled options.
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
        #disabled: boolean;
        #notifyParentOfDisabledChange: (me: __Option) => void;
        public constructor() {
            this.baseElem = document.createElement("div");
            this.baseElem.classList.add(OmHooks.SkPickOne.Class.OPT_BASE);
            this.#disabled = false;
        }
        public __registerParent<__O extends __Option>(onDisabledChange: (me: __O) => void): void {
            this.#notifyParentOfDisabledChange = onDisabledChange as (me: __Option) => void;
        }
        public get disabled(): boolean {
            return this.#disabled;
        }
        public set disabled(newDisabled: boolean) {
            if (this.disabled !== newDisabled) {
                this.baseElem.toggleAttribute("aria-disabled", newDisabled);
                this.#disabled = newDisabled;
                this.#notifyParentOfDisabledChange(this);
            }
        }
    }
    Object.freeze(SkPickOne);
    Object.freeze(SkPickOne.prototype);
}
Object.freeze(SkPickOne);
Object.freeze(SkPickOne.prototype);
