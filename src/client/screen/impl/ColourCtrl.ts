// Tell WebPack about the css we want:
require("assets/style/colour/index.css");

import { StorageHooks } from "defs/StorageHooks";
import { OmHooks } from "defs/OmHooks";
import { SkPickOne } from "../../../client/utils/SkPickOne";

import { SkScreen } from "../SkScreen";


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
        const sel = new ColourCtrlScreen.PickOne();
        this.baseElem.appendChild(sel.baseElem);
        (this.sel as ColourCtrlScreen.PickOne) = sel;

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
            if (!this.garageDoorElem) throw new Error;
            this.garageDoorElem.style.transitionDuration = `${Colour.SMOOTH_CHANGE_DURATION/3.0}ms`;

            Colour.Schemes.forEach((schemeDesc) => {
                this.addOption(new PickOne.Option(schemeDesc));
            });
            this.selectOpt(this.getOptById("snakey")!, false);
        }

        public _onHoverOpt(opt: O): void {
            ;
        }

        public _onSelectOpt(opt: O): void {
            localStorage.setItem(
                StorageHooks.LocalKeys.COLOUR_ID,
                opt.desc.id,
            );
            localStorage.setItem(
                StorageHooks.LocalKeys.COLOUR_LITERAL,
                opt.cssLiteral,
            );
            const duration = (Colour.SMOOTH_CHANGE_DURATION / 3.0) + 80;
            setTimeout(() => {
                this.garageDoorElem.style.opacity = 1.0.toString();
            setTimeout(() => {
                document.documentElement.dataset[OmHooks.General.Dataset.COLOUR_SCHEME] = opt.desc.id;
            setTimeout(() => {
                this.garageDoorElem.style.opacity = 0.0.toString();
            }, duration);
            }, duration);
            }, duration);
        }

        public getOptById(searchId: Colour.Scheme["id"]): O | undefined {
            return this.options.find((opt) => opt.desc.id === searchId);
        }
    }
    export namespace PickOne {
        /**
         *
         */
        export class Option extends SkPickOne._Option {

            public readonly desc: Colour.Scheme;

            public readonly cssLiteral: string;

            public constructor(desc: Colour.Scheme) {
                super();
                this.desc = desc;
                // TODO.impl `this.cssLiteral`;
            }
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
        "pFaceMe", "pFaceMeOpp",
        "pFaceTeammate", "pFaceImtlTeammate",
        "pFaceOpponent", "pFaceImtlOpponent",
    ]);
    export const Schemes = Object.freeze(([{
        id: "snakey",
        displayName: "Snakey",
        author: "N.W.",
    }, {
        id: "smooth-stone",
        displayName: "Smooth Stone",
        author: "Dav",
    },
    ] as Array<Scheme>).map((scheme) => Object.freeze(scheme)));
    export type Scheme = Readonly<{
        /**
         * Must be matched in the CSS as an attribute value.
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
