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
        const f = this.goToScreen.bind(this);
        this.dict = Object.freeze({
            // TODO.impl turn this into a class that dynamically imports js and css
            // for all online-related modules together only once needed.
            [ Id.HOME          ]: new         HomeScreen(Id.HOME         ,t,p,f),
            [ Id.HOW_TO_PLAY   ]: new    HowToPlayScreen(Id.HOW_TO_PLAY  ,t,p,f),
            [ Id.HOW_TO_HOST   ]: new    HowToHostScreen(Id.HOW_TO_HOST  ,t,p,f),
            [ Id.COLOUR_CTRL   ]: new   ColourCtrlScreen(Id.COLOUR_CTRL  ,t,p,f),
            [ Id.SETUP_OFFLINE ]: new SetupOfflineScreen(Id.SETUP_OFFLINE,t,p,f),
            [ Id.PLAY_OFFLINE  ]: new  PlayOfflineScreen(Id.PLAY_OFFLINE ,t,p,f),
            [ Id.GROUP_JOINER  ]: new  GroupJoinerScreen(Id.GROUP_JOINER ,t,p,f),
            [ Id.SETUP_ONLINE  ]: new  SetupOnlineScreen(Id.SETUP_ONLINE ,t,p,f),
            [ Id.GROUP_LOBBY   ]: new   GroupLobbyScreen(Id.GROUP_LOBBY  ,t,p,f),
            [ Id.PLAY_ONLINE   ]: new   PlayOnlineScreen(Id.PLAY_ONLINE  ,t,p,f),
        });
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
    public goToScreen<SID extends SkScreen.Id>(
        // NOTE: using a tuple wrapper to expand bundled type.
        destId: SID,
        ctorArgs: SkScreen.EntranceArgs[SID],
        historyDirection: "forward" | "backward" = "forward",
    ): boolean {
        const destScreen = this.dict[destId];
        if (this.currentScreen === destScreen) {
            // I don't see why this would ever need to happen.
            // If we find need to write code that allows for this,
            // rewrite the return-value spec.
            throw "never";
        }
        if ((this.currentScreen === undefined) || this.currentScreen.leave()) {
            // Note on above "nullish coalesce": Special case entered
            // during construction when there is no currentScreen yet.
            // Any confirm-leave prompts made to the user were OK-ed.
            type enterFunc = (args: typeof ctorArgs, historyDirection: "forward" | "backward") => void;
            (destScreen.enter as enterFunc)(ctorArgs, historyDirection);
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