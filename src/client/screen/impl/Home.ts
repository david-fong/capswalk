import { SkScreen } from "../SkScreen";
import { OmHooks } from 'defs/OmHooks';


/**
 *
 */
export class HomeScreen extends SkScreen {

    protected __lazyLoad(): void {
        this.baseElem.classList.add(
            OmHooks.Screen.Impl.Home.Class.SCREEN
        );
        { const pOfflineB = document.createElement("button");
        pOfflineB.innerText = "Play Offline";
        pOfflineB.onclick = this.requestGoToScreen.bind(this, SkScreen.Id.PLAY_OFFLINE);
        this.baseElem.appendChild(pOfflineB); }

        { const joinOnlineB = document.createElement("button");
        joinOnlineB.innerText = "Join an Online Game";
        joinOnlineB.onclick = this.requestGoToScreen.bind(this, SkScreen.Id.PLAY_ONLINE);
        this.baseElem.appendChild(joinOnlineB); }

        { const hostOnlineB = document.createElement("button");
        hostOnlineB.innerText = "Host an Online Game";
        hostOnlineB.onclick = this.requestGoToScreen.bind(this, SkScreen.Id.HOW_TO_HOST);
        this.baseElem.appendChild(hostOnlineB); }
    }
}
Object.freeze(HomeScreen);
Object.freeze(HomeScreen.prototype);
