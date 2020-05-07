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

    private readonly dict: {
        readonly [SID in SkScreen.Id]: SkScreen<SID>;
    };

    #currentScreen: SkScreen<SkScreen.Id>;

    public constructor(toplevel: TopLevel, baseElem: HTMLElement) {
        baseElem.setAttribute("role", "presentation");
        // Setting role="presentation" is similar to setting "display: content"
        // Setting aria-hidden="true" is similar to setting "visibility: hidden"
        const t = toplevel;
        const p = baseElem;
        const f = this.goToScreen.bind(this);
        this.dict = Object.freeze({
            [ SkScreen.Id.HOME          ]: new         HomeScreen(t,p,f),
            [ SkScreen.Id.HOW_TO_PLAY   ]: new    HowToPlayScreen(t,p,f),
            [ SkScreen.Id.HOW_TO_HOST   ]: new    HowToHostScreen(t,p,f),
            [ SkScreen.Id.COLOUR_CTRL   ]: new   ColourCtrlScreen(t,p,f),
            [ SkScreen.Id.SETUP_OFFLINE ]: new SetupOfflineScreen(t,p,f),
            [ SkScreen.Id.PLAY_OFFLINE  ]: new  PlayOfflineScreen(t,p,f),
            [ SkScreen.Id.GROUP_JOINER  ]: new  GroupJoinerScreen(t,p,f),
            [ SkScreen.Id.SETUP_ONLINE  ]: new  SetupOnlineScreen(t,p,f),
            [ SkScreen.Id.GROUP_LOBBY   ]: new   GroupLobbyScreen(t,p,f),
            [ SkScreen.Id.PLAY_ONLINE   ]: new   PlayOnlineScreen(t,p,f),
        });
        this.goToScreen(SkScreen.Id.HOME, {});
    }

    public goToScreen<SID extends [SkScreen.Id]>(
        // NOTE: use a tuple wrapper to expand bundled type.
        destId: SID[0],
        ctorArgs: SkScreen.CtorArgs<SID[0]>,
    ): void {
        const destScreen = this.dict[destId] as SkScreen<SID[0]>;
        if (this.currentScreen === destScreen) {
            // I don't see why this would ever need to happen.
            throw new Error ("never happens. see comment in source.");
        }
        if ((!this.currentScreen) || this.currentScreen.leave()) {
            // Note on above nullish coalesce: Special case entered
            // during construction when there is no currentScreen yet.
            // Any confirm-leave prompts made to the user were OK-ed.
            destScreen.enter(ctorArgs);
            this.#currentScreen = destScreen;
        }
    }

    public get currentScreen(): SkScreen<SkScreen.Id> {
        return this.#currentScreen;
    }
}
Object.freeze(AllSkScreens);
Object.freeze(AllSkScreens.prototype);
