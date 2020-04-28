import { OmHooks } from "defs/OmHooks";
import { AllSkScreens } from "./screen/AllSkScreens";

// TODO.impl Allow users to change the spotlight radius via slider.
export class TopLevel {

    private readonly allScreens: AllSkScreens;


    public constructor() {
        const allScreensElem = document.getElementById(OmHooks.Screen.Id.ALL_SCREENS);
        if (!allScreensElem) { throw new Error; }
        this.allScreens = new AllSkScreens(allScreensElem);
    }
}
export namespace TopLevel {
}
Object.freeze(TopLevel);
Object.freeze(TopLevel.prototype);
