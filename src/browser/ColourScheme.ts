import { WebHooks } from "./WebHooks";


/**
 *
 */
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
        };
        hostElement.appendChild(sel);
        this.sel = sel as Colour["sel"];
        sel.selectedIndex = 0;
        sel.dispatchEvent(new Event("change"));
    }

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
    // references / aliases:
    export const Swatch = WebHooks.Colour.Swatch;
    export const Scheme = WebHooks.Colour.Scheme;
    export namespace Scheme {
        export type Id = WebHooks.Colour.Scheme.Id;
    }
}
Object.freeze(Colour);
Object.freeze(Colour.prototype);
