import { StorageHooks } from "defs/StorageHooks";
import { OmHooks } from 'defs/OmHooks';

/**
 *
 * CSS variables declared for each color scheme are in the
 * form: `--colour-schemeId-swatchName`. js/ts should not need to
 * interface with these values directly. Instead, it should use
 * provided class names and dataset attributes as to minimize its
 * effort when colour schemes are swapped.
 */
// TODO.design I want each option to show the swatches.
export class Colour {

    public readonly sel: HTMLSelectElement & {value: Colour.Scheme.Id};

    public readonly tintElem: HTMLElement;

    public constructor(hostElement: HTMLElement) {
        const sel = document.createElement("select");
        //sel.name =
        for (const scheme of Colour.Scheme) {
            const opt = document.createElement("option");
            opt.innerText = `\"${scheme.displayName}\" by ${scheme.author}`;
            opt.value = scheme.id;
            sel.add(opt);
        }
        sel.onchange = () => {
            sel.blur();
            this.switchToScheme(this.sel.value);
            localStorage.setItem(
                StorageHooks.LocalKeys.COLOUR_ID,
                this.sel.value,
            );
        };
        hostElement.appendChild(sel);
        this.sel = sel as Colour["sel"];

        // Initialize to the user's last selected colour scheme (if it exists).
        const lastUsedSchemeId = localStorage.getItem(StorageHooks.LocalKeys.COLOUR_ID);
        if (lastUsedSchemeId) {
            for (let i = 0; i < sel.length; i++) {
                if ((sel.item(i) as HTMLOptionElement).value === lastUsedSchemeId) {
                    sel.selectedIndex = i;
                    sel.dispatchEvent(new Event("change"));
                }
            }
        }
        this.tintElem = document.getElementById(OmHooks.Screen.Id.SCREEN_TINT)!;
        if (!this.tintElem) throw new Error;
        this.tintElem.style.transitionDuration = `${Colour.SMOOTH_CHANGE_DURATION}ms`;
    }

    /**
     * See `:/assets/style/colour/index.css`.
     *
     * @param schemeId -
     */
    public switchToScheme(schemeId: Colour.Scheme.Id): void {
        const duration = Colour.SMOOTH_CHANGE_DURATION / 4.0;
        setTimeout(() => {
            this.tintElem.style.opacity = 1.0.toString();
            setTimeout(() => {
                for (const swatchName of Colour.Swatch) {
                    document.body.style.setProperty(
                        `--colour-selected-${swatchName}`,
                        `--colour-${schemeId}-${swatchName}`,
                    );
                }
                setTimeout(() => {
                    this.tintElem.style.opacity = 0.0.toString();
                }, duration);
            }, duration);
        }, duration);
    }
}
export namespace Colour {
    export const Swatch = Object.freeze(<const>[
        "mainFg", "mainBg",
        "tileFg", "tileBg", "tileBd",
        "healthFg", "healthBg",
        "pFaceMe",
        "pFaceTeammate", "pFaceImtlTeammate",
        "pFaceOpponent", "pFaceImtlOpponent",
    ]);
    /**
     * The scheme id `selected` is a special value and should not
     * be used.
     */
    export const Scheme = Object.freeze([
        {
        id: "snakey",
        displayName: "Snakey",
        author: "N.W.",
    }, {
        id: "smoothstone",
        displayName: "Smooth Stone",
        author: "Dav",
    },
    ].map((scheme) => Object.freeze(scheme)));
    export namespace Scheme {
        export type Id = (typeof Scheme)[number]["id"];
    }

    /**
     * How long the entire smooth transition between colour schemes
     * should last in units of milliseconds.
     */
    export const SMOOTH_CHANGE_DURATION = 2_000.0;
}
Object.freeze(Colour);
Object.freeze(Colour.prototype);
