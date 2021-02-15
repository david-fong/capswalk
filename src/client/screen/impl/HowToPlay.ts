import { JsUtils, BaseScreen } from '../BaseScreen';

/** */
export class HowToPlayScreen extends BaseScreen<BaseScreen.Id.HOW_TO_PLAY> {

	/** @override */
	protected _lazyLoad(): void {
		Object.freeze(this); //🧊
	}
}
Object.freeze(HowToPlayScreen);
Object.freeze(HowToPlayScreen.prototype);