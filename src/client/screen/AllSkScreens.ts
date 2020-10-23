import { JsUtils } from "defs/JsUtils";
import { SkScreen } from "./SkScreen";
import { TopLevel } from "../TopLevel";

import {         HomeScreen } from "./impl/Home";
import {    HowToPlayScreen } from "./impl/HowToPlay";
import {    HowToHostScreen } from "./impl/HowToHost";
import {   ColourCtrlScreen } from "./impl/ColourCtrl";
// ====:   ~~~ OFFLINE ~~~  :============================
import { SetupOfflineScreen } from "./impl/SetupOffline";
import {  PlayOfflineScreen } from "./impl/PlayOffline";
// ====:   ~~~ ONLINE ~~~~  :============================
import {  GroupJoinerScreen } from "./impl/GroupJoiner";
import {  SetupOnlineScreen } from "./impl/SetupOnline";
import {   GroupLobbyScreen } from "./impl/GroupLobby";
import {   PlayOnlineScreen } from "./impl/PlayOnline";


/**
 *
 */
export class AllSkScreens {

    public readonly dict: SkScreen.Dict;

    #currentScreen: SkScreen<SkScreen.Id>;

    public constructor(top: TopLevel, baseElem: HTMLElement) {
        baseElem.setAttribute("role", "presentation");
        // Setting role="presentation" is similar to setting "display: content"
        // Setting aria-hidden="true" is similar to setting "visibility: hidden"
        const Id = SkScreen.Id;
        const t = top;
        const p = baseElem;
        const g = Object.freeze(this.goToScreen.bind(this));
        this.dict = Object.freeze({
            // TODO.impl turn this into a class that dynamically imports js and css
            // for all online-play-related modules together only once needed.
            [ Id.HOME          ]: new         HomeScreen(Id.HOME         ,t,p,g),
            [ Id.HOW_TO_PLAY   ]: new    HowToPlayScreen(Id.HOW_TO_PLAY  ,t,p,g),
            [ Id.HOW_TO_HOST   ]: new    HowToHostScreen(Id.HOW_TO_HOST  ,t,p,g),
            [ Id.COLOUR_CTRL   ]: new   ColourCtrlScreen(Id.COLOUR_CTRL  ,t,p,g),
            [ Id.SETUP_OFFLINE ]: new SetupOfflineScreen(Id.SETUP_OFFLINE,t,p,g),
            [ Id.PLAY_OFFLINE  ]: new  PlayOfflineScreen(Id.PLAY_OFFLINE ,t,p,g),
            [ Id.GROUP_JOINER  ]: new  GroupJoinerScreen(Id.GROUP_JOINER ,t,p,g),
            [ Id.SETUP_ONLINE  ]: new  SetupOnlineScreen(Id.SETUP_ONLINE ,t,p,g),
            [ Id.GROUP_LOBBY   ]: new   GroupLobbyScreen(Id.GROUP_LOBBY  ,t,p,g),
            [ Id.PLAY_ONLINE   ]: new   PlayOnlineScreen(Id.PLAY_ONLINE  ,t,p,g),
        });
        JsUtils.propNoWrite(this as AllSkScreens, ["dict"]);

        // note: "isr" as in "Initial Screen Request".
        const isrId = window.location.hash.slice(1) as SkScreen.Id;
        const isr = this.dict[isrId];
        if (isr && isr.initialScreen) {
            this.goToScreen(isr.initialScreen, {});
        } else {
            this.goToScreen(SkScreen.Id.HOME, {});
        }
        window.addEventListener("popstate", (ev: PopStateEvent) => {
            // For corresponding calls to pushState and replaceState,
            // see SkScreen.enter.
            this.goToScreen(...this.currentScreen.getNavPrevArgs())
        });
    }

    /**
     * @returns false if the leaving of the current screen was cancelled.
     * @param destId -
     * @param ctorArgs -
     */
    public async goToScreen<SID extends SkScreen.Id>(
        // NOTE: using a tuple wrapper to expand bundled type.
        destId: SID,
        ctorArgs: SkScreen.EntranceArgs[SID],
        navDir: SkScreen.NavDir = SkScreen.NavDir.FORWARD,
    ): Promise<boolean> {
        const destScreen = this.dict[destId];
        if (this.currentScreen === destScreen) {
            // I don't see why this would ever need to happen.
            // If we find need to write code that allows for this,
            // rewrite the return-value spec.
            throw new Error("never");
        }
        if ((this.currentScreen === undefined) || this.currentScreen._leave(navDir)) {
            // Note on above "nullish coalesce": Special case entered
            // during construction when there is no currentScreen yet.
            // Any confirm-leave prompts made to the user were OK-ed.
            type enterFunc = (navDir: SkScreen.NavDir, args: typeof ctorArgs) => Promise<void>;
            await (destScreen._enter as enterFunc)(navDir, ctorArgs);
            this.#currentScreen = destScreen;
            return true;
        }
        return true;
    }

    public get currentScreen(): SkScreen<SkScreen.Id> {
        return this.#currentScreen;
    }
}
Object.freeze(AllSkScreens);
Object.freeze(AllSkScreens.prototype);