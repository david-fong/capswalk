// Tell WebPack about the css we want:
require("assets/style/colour/_barrel.css");

import { StorageHooks } from "defs/StorageHooks";
import { SkPickOne } from "../../../client/utils/SkPickOne";

import { OmHooks, SkScreen } from "../SkScreen";
const OMHC = OmHooks.Screen.Impl.ColourCtrl.Class;
const CSS_FX = OmHooks.General.Class;

/**
 *
 */
export class ColourCtrlScreen extends SkScreen<SkScreen.Id.COLOUR_CTRL> {

    public readonly canBeInitialScreen = true;

    public readonly sel: ColourCtrlScreen.PickOne;

    /**
     * @override
     */
    protected _lazyLoad(): void {
        this.baseElem.classList.add(OMHC.BASE);
        this.baseElem.appendChild(this.nav.prev);

        const sel
            // @ts-expect-error : RO=
            = this.sel
            = new ColourCtrlScreen.PickOne();
        this.baseElem.appendChild(sel.baseElem);

        // Highlight the user's last selected colour scheme (if it exists).
        // This will already have been loaded up during page load, hence
        // passing `false` to the `noCallback` argument
        const lastUsedSchemeId = localStorage.getItem(StorageHooks.LocalKeys.COLOUR_ID);
        if (lastUsedSchemeId) {
            this.sel.selectOpt(this.sel.getOptById(lastUsedSchemeId)!, false);
        }
    }
}
export namespace ColourCtrlScreen {
    type O = PickOne.Option;
    /**
     *
     */
    export class PickOne extends SkPickOne<O> {

        public readonly garageDoorElem: HTMLElement;

        public constructor() {
            super();
            this.garageDoorElem = document.getElementById(OmHooks.Screen.Id.SCREEN_TINT)!;
            this.garageDoorElem.style.transitionDuration = (Colour.SMOOTH_CHANGE_DURATION/3.0) + "ms";

            Colour.Schemes.forEach((schemeDesc) => {
                this.addOption(new PickOne.Option(schemeDesc));
            });
            this.selectOpt(this.getOptById(
                localStorage.getItem(StorageHooks.LocalKeys.COLOUR_ID) ?? "snakey",
            )!, false);
        }

        public _onHoverOpt(opt: O): void {
            ;
        }

        public _onSelectOpt(opt: O): void {
            {const docStyle = document.documentElement.style;
            for (const swatchName of Colour.Swatch) {
                const varString = "--colour-" + swatchName;
                docStyle.setProperty(varString, "");
            }}
            localStorage.setItem(
                StorageHooks.LocalKeys.COLOUR_ID,
                opt.desc.id,
            );
            localStorage.setItem(
                StorageHooks.LocalKeys.COLOUR_LITERAL,
                opt.cssLiteral,
            );
            // This actually might be nicer-written than
            // it would be using the web animations API...
            const duration = (Colour.SMOOTH_CHANGE_DURATION / 3.0);
            const gdStyle = this.garageDoorElem.style;
            gdStyle.opacity = "1.0";
            gdStyle.pointerEvents = "all";
            this.baseElem.style.pointerEvents = "none";
            setTimeout(() => {
                document.documentElement.dataset[OmHooks.General.Dataset.COLOUR_SCHEME] = opt.desc.id;
            setTimeout(() => {
                gdStyle.opacity = "0.0";
                gdStyle.pointerEvents = "";
                this.baseElem.style.pointerEvents = "";
            }, duration);
            }, duration);
        }

        public getOptById(searchId: Colour.Scheme["id"]): O | undefined {
            return this.options.find((opt) => opt.desc.id === searchId);
        }
    }
    export namespace PickOne {
        /**
         */
        export class Option extends SkPickOne._Option {

            public readonly desc: Colour.Scheme;

            public readonly cssLiteral: string;

            public constructor(desc: Colour.Scheme) {
                super();
                this.desc = desc;
                const base = this.baseElem;
                base.classList.add(OMHC.OPTION);
                base.dataset[OmHooks.General.Dataset.COLOUR_SCHEME] = desc.id;

                const label = document.createElement("span");
                label.classList.add(OMHC.OPTION_LABEL); {
                    const title = document.createElement("div");
                    title.classList.add(OMHC.OPTION_LABEL_TITLE);
                    title.textContent = desc.displayName;
                    label.appendChild(title);
                } {
                    const author = document.createElement("div");
                    author.classList.add(OMHC.OPTION_LABEL_AUTHOR);
                    author.textContent = "by " + desc.author;
                    label.appendChild(author);
                }
                base.appendChild(label);

                for (let i = 0; i < Option.NUM_PREVIEW_SLOTS - 1; i++) {
                    base.appendChild(document.createElement("span"));
                }
                // At below: We need to append it to something to use getComputedStyle :/
                // We attach it in the proper place once we get that.
                document.body.appendChild(base);
                let cssLiteral = "";
                const computedStyle = window.getComputedStyle(base);
                for (const swatchName of Colour.Swatch) {
                    const varString = "--colour-" + swatchName;
                    cssLiteral += varString + ":" + computedStyle.getPropertyValue(varString) + ";";
                }
                this.cssLiteral = cssLiteral;
            }
        }
        export namespace Option {
            /**
             * This must match the number slots used in the CSS.
             */
            export const NUM_PREVIEW_SLOTS = 8;
        }
        Object.freeze(Option);
        Object.freeze(Option.prototype);
    }
    Object.freeze(PickOne);
    Object.freeze(PickOne.prototype);
}
Object.freeze(ColourCtrlScreen);
Object.freeze(ColourCtrlScreen.prototype);


/**
 *
 */
export namespace Colour {
    export const Swatch = Object.freeze(<const>[
        "mainFg", "mainBg",
        "tileFg", "tileBg", "tileBd",
        "healthFg", "healthBg",
        "pFaceMe", "pFaceMeOppo",
        "pFaceTeammate", "pFaceImtlTeammate",
        "pFaceOpponent", "pFaceImtlOpponent",
    ]);
    export const Schemes = Object.freeze<Array<Scheme>>(([{
        id: "snakey",
        displayName: "Snakey",
        author: "N.W.",
    }, {
        id: "smooth-stone",
        displayName: "Smooth Stone",
        author: "Dav",
    }, {
        id: "murky-dive",
        displayName: "Murky Dive",
        author: "Stressed Dav", // I Was just working on game-grid scroll-wrap padding :')
    },
    ]).map((scheme) => Object.freeze(scheme)));
    export type Scheme = Readonly<{
        /**
         * Must be matched in the CSS as an attribute value.
         * Must also equal the name of the original source file.
         */
        id: string;
        displayName: string;
        author: string;
    }>;

    /**
     * How long the entire smooth transition between colour schemes
     * should last in units of milliseconds.
     */
    export const SMOOTH_CHANGE_DURATION = 2_000.0;
}
Object.freeze(Colour);