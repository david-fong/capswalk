import { OmHooks } from "defs/OmHooks";


/**
 * **IMPORTANT:**
 * Consumers and implementers of this utility widget must ensure that
 * a call to `selectOpt` is made with valid arguments before it becomes
 * interfaceable to a browser user.
 *
 * https://www.w3.org/TR/wai-aria-1.1/#listbox
 */
// TODO.learn https://www.w3.org/TR/wai-aria-1.1/#managingfocus
export abstract class SkPickOne<O extends SkPickOne._Option> {

    public readonly baseElem: HTMLElement;

    protected readonly options: Array<O>;

    #confirmedOpt: O;
    #hoveredOpt: O;
    #isValid: boolean;

    public constructor() {
        const base = document.createElement("div");
        base.tabIndex = 0;
        base.classList.add(OmHooks.SkPickOne.Class.BASE);
        base.addEventListener("keydown", this._onKeyDown.bind(this));
        base.setAttribute("role", "listbox");
        base.addEventListener("pointerenter", (ev) => {
            window.requestAnimationFrame((time) => {
                // Autofocus on pointerenter to hear keyboard events:
                base.focus();
            });
        });
        this.baseElem = base;

        this.options = [];
    }

    public addOption(opt: O): void {
        this.options.push(opt);
        this.baseElem.appendChild(opt.baseElem);
        opt.baseElem.addEventListener("pointerenter", this.hoverOpt.bind(this, opt));
        opt.baseElem.addEventListener("click", this.selectOpt.bind(this, opt, true));
        opt._registerParent(this._onOptDisabledChange.bind(this));
    }

    public hoverOpt(opt: O): void {
        if (this.hoveredOpt !== opt) {
            // nullish coalesce is for edge-case on adding first option.
            this.hoveredOpt?.baseElem.setAttribute("aria-active-descendant", "false");
            this.#hoveredOpt = opt;
            this.hoveredOpt.baseElem.setAttribute("aria-active-descendant", "true");
        }
    }
    protected abstract _onHoverOpt(opt: O): void;

    public selectOpt(opt: O, doCallback: boolean = true): void {
        if (!opt) throw Error("opt must be defined");
        // We must ensure hovering before executing confirmation:
        this.hoverOpt(opt);
        // Now that hovering is done, execute confirmation of selection:
        if (this.confirmedOpt !== opt) {
            // nullish coalesce is for edge-case on adding first option.
            this.confirmedOpt?.baseElem.setAttribute("aria-selected", "false");
            this.#confirmedOpt = opt;
            this.confirmedOpt.baseElem.setAttribute("aria-selected", "true");
            if (doCallback) {
                this._onSelectOpt(opt);
            }
        }
    }
    /**
     * When selecting an option makes changes to other elements,
     * implementations should see the aria attributes `aria-controls`
     * and `aria-describedby`. Ex. Each option may encapsulate a
     * description element (use described-by) that is made visible
     * in a separate pane (use aria-controls) when selected.
     */
    protected abstract _onSelectOpt(opt: O): void;

    public get confirmedOpt(): O {
        return this.#confirmedOpt;
    }
    public get hoveredOpt(): O {
        return this.#hoveredOpt;
    }

    private _onOptDisabledChange(opt: O): void {
        if (this.confirmedOpt === opt) {
            this._isValid = !opt.disabled;
        }
    }

    private set _isValid(newIsValid: boolean) {
        if (this._isValid !== newIsValid) {
            this.baseElem.setAttribute("aria-invalid", (newIsValid ? "false": "true"));
            this.#isValid = newIsValid;
            // TODO.impl styling.
        }
    }
    private get _isValid(): boolean {
        return this.#isValid;
    }

    private _onKeyDown(ev: KeyboardEvent): boolean {
        if (ev.key === " " || ev.key === "Enter") {
            this.selectOpt(this.hoveredOpt);
            ev.preventDefault();
            return false;
        } else {
            const hoverOptIndex = this.options.indexOf(this.hoveredOpt);
            if (ev.key === "ArrowDown" || ev.key === "Down") {
                for (let i = hoverOptIndex + 1; i < (this.options.length); i++) {
                    const opt = this.options[i];
                    if (opt.disabled) continue;
                    this.hoverOpt(opt);
                    ev.preventDefault();
                    return false;
                }
            } else if (ev.key === "ArrowUp" || ev.key === "Up") {
                for (let i = hoverOptIndex - 1; i >= 0; i--) {
                    const opt = this.options[i];
                    if (opt.disabled) continue;
                    this.hoverOpt(opt);
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
     * https://www.w3.org/TR/wai-aria-1.1/#option
     */
    export abstract class _Option {
        public readonly baseElem: HTMLElement;
        #disabled: boolean;
        #notifyParentOfDisabledChange: (me: _Option) => void;
        public constructor() {
            const base = this.baseElem = document.createElement("div");
            base.classList.add(OmHooks.SkPickOne.Class.OPT_BASE);
            base.setAttribute("role", "option");
            this.#disabled = false;
        }
        public _registerParent<_O extends _Option>(onDisabledChange: (me: _O) => void): void {
            this.#notifyParentOfDisabledChange = onDisabledChange as (me: _Option) => void;
        }
        public get disabled(): boolean {
            return this.#disabled;
        }
        public set disabled(newDisabled: boolean) {
            if (this.disabled !== newDisabled) {
                this.baseElem.setAttribute("aria-disabled", (newDisabled ? "true" : "false"));
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
