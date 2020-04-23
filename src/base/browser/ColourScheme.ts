import { StorageHooks } from 'browser/StorageHooks';

/**
 *
 * CSS variables declared for each color scheme are in the
 * form: `--colour-schemeId-swatchName`. js/ts should not need to
 * interface with these values directly. Instead, it should use
 * provided class names and dataset attributes as to minimize its
 * effort when colour schemes are swapped.
 */
// TODO.design I want each option to show the swatches. To make the
// transition smooth without making every element with the CSS have
// transition behaviour for colour-related properties, use a garage-
// door with
export class Colour {

    public readonly sel: HTMLSelectElement & {value: Colour.Scheme.Id};

    public constructor(hostElement: HTMLElement) {
        const sel = document.createElement("select");
        for (const schemeId of (Object.keys(Colour.Scheme) as TU.RoArr<Colour.Scheme.Id>)) {
            const opt = document.createElement("option");
            opt.innerText = Colour.Scheme[schemeId].displayName;
            opt.value = schemeId;
            sel.add(opt);
        }
        sel.onchange = () => {
            sel.blur();
            this.switchToScheme(this.sel.value);
            localStorage.setItem(
                StorageHooks.Keys.COLOUR,
                this.sel.value,
            );
        };
        hostElement.appendChild(sel);
        this.sel = sel as Colour["sel"];
        sel.selectedIndex = 0;
        sel.dispatchEvent(new Event("change"));
    }

    /**
     * See `:/assets/style/colour/index.css`.
     *
     * @param schemeId -
     */
    public switchToScheme(schemeId: Colour.Scheme.Id): void {
        for (const swatchName of Colour.Swatch) {
            document.body.style.setProperty(
                `--colour-selected-${swatchName}`,
                `--colour-${schemeId}-${swatchName}`,
            );
        }
    }
}
export namespace Colour {
    export const Swatch = Object.freeze(<const>[
        "mainFg", "mainBg",
        "tileFg", "tileBg", "tileBd",
        "health",
        "pFaceMe",
        "pFaceTeammate", "pFaceImmortalTeammate",
        "pFaceOpponent", "pFaceImmortalOpponent",
    ]);
    /**
     * The scheme id `selected` is a special value and should not
     * be used.
     */
    export const Scheme = Object.freeze(<const>{
        ["snakey"]: Object.freeze(<const>{
            displayName: "Snakey by N.W.",
        }),
    });
    export namespace Scheme {
        export type Id = keyof typeof Scheme;
    }
}
Object.freeze(Colour);
Object.freeze(Colour.prototype);
