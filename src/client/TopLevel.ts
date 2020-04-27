import { OmHooks } from "defs/OmHooks";
import { AllSkScreens } from "./screen/AllSkScreens";

// TODO.impl Allow users to change the spotlight radius via slider.
export class TopLevel {

    public readonly dynamicChunks: typeof TopLevel.DynamicChunks;

    private readonly allScreens: AllSkScreens;


    public constructor() {
        this.dynamicChunks = TopLevel.DynamicChunks;
        const allScreensElem = document.getElementById(OmHooks.Screen.Id.ALL_SCREENS);
        if (!allScreensElem) { throw new Error; }
        this.allScreens = new AllSkScreens(allScreensElem);
    }
}
export namespace TopLevel {
    /**
     *
     */
    export const DynamicChunks = Object.freeze({
        GameChunk: async () => import(/*  */"./game/ScratchMakeGame"),
    });
}
Object.freeze(TopLevel);
