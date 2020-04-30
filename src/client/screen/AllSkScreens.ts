import { SkScreen } from "./SkScreen";

import {        HomeScreen } from "./impl/Home";
import {   GameSetupScreen } from "./impl/GameSetup";
import {  SeshJoinerScreen } from "./impl/SeshJoiner";
import {   HowToPlayScreen } from "./impl/HowToPlay";
import {   HowToHostScreen } from "./impl/HowToHost";
import { PlayOfflineScreen } from "./impl/PlayOffline";
import {  PlayOnlineScreen } from "./impl/PlayOnline";
import { ColourCtrlScreen } from "./impl/ColourCtrl";


export class AllSkScreens {

    private readonly dict: Readonly<Record<SkScreen.Id, SkScreen>>;

    #currentScreen: SkScreen;

    public constructor(baseElem: HTMLElement) {
        const p = baseElem;
        const f = this.goToScreen.bind(this);
        this.dict = Object.freeze({
            [ SkScreen.Id.HOME         ]: new        HomeScreen(p,f),
            [ SkScreen.Id.HOW_TO_PLAY  ]: new   HowToPlayScreen(p,f),
            [ SkScreen.Id.HOW_TO_HOST  ]: new   HowToHostScreen(p,f),
            [ SkScreen.Id.GAME_SETUP   ]: new   GameSetupScreen(p,f),
            [ SkScreen.Id.COLOUR_CTRL  ]: new  ColourCtrlScreen(p,f),
            [ SkScreen.Id.PLAY_OFFLINE ]: new PlayOfflineScreen(p,f),
            [ SkScreen.Id.PLAY_ONLINE  ]: new  PlayOnlineScreen(p,f),
            [ SkScreen.Id.SESH_JOINER  ]: new  SeshJoinerScreen(p,f),
        });
        this.goToScreen(SkScreen.Id.HOME);
    }

    public goToScreen(destId: SkScreen.Id): void {
        const destScreen = this.dict[destId];
        if (this.currentScreen === destScreen) {
            // I don't see why this would ever need to happen.
            throw new Error ("never happens. see comment in source.");
        }
        if ((!this.currentScreen) || this.currentScreen.leave()) {
            // Note on above nullish coalesce: Special case entered
            // during construction when there is no currentScreen yet.
            // Any confirm-leave prompts made to the user were OK-ed.
            destScreen.enter();
            this.#currentScreen = destScreen;
        }
    }

    public get currentScreen(): SkScreen {
        return this.#currentScreen;
    }
}
Object.freeze(AllSkScreens);
Object.freeze(AllSkScreens.prototype);
