import { SkScreen } from "../SkScreen";


export class HomeScreen extends SkScreen {

    protected __lazyLoad(): void {
        const pOfflineB = document.createElement("button");
        pOfflineB.innerText = "Play Offline";
        pOfflineB.onclick = (ev) => {
            this.requestGoToScreen(SkScreen.Id.PLAY_OFFLINE);
        };
        this.baseElem.appendChild(pOfflineB);
    }

}
Object.freeze(HomeScreen);
Object.freeze(HomeScreen.prototype);
