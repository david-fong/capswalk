import { JsUtils, StorageHooks } from "../../BaseScreen";
import { PickOne as _PickOne } from "::utils/PickOne";


type O = EmojiSetPickOne.Option;
type ID = typeof StorageHooks.Local.emojiFont;
/** */
export class EmojiSetPickOne extends _PickOne<O> {

	public constructor() {
		super();

		this.addOption(new EmojiSetPickOne.Option("system"));
		this.addOption(new EmojiSetPickOne.Option("twemoji"));
		this.selectOpt(this.getOptById(
			StorageHooks.Local.emojiFont,
		)!, false);
	}

	public override _onHoverOpt(opt: O): void {
		void opt;
	}

	public override _onSelectOpt(opt: O): void {
		StorageHooks.Local.emojiFont = opt.desc;
	}

	public getOptById(searchId: ID): O | undefined {
		return this.options.find((opt) => opt.desc === searchId);
	}
}
export namespace EmojiSetPickOne {
	/** */
	export class Option extends _PickOne._Option {
		public readonly desc: ID;
		public constructor(desc: ID) {
			super();
			this.desc = desc;
			this.baseElem.textContent = desc;
		}
	}
	Object.freeze(Option);
	Object.freeze(Option.prototype);
}
Object.freeze(EmojiSetPickOne);
Object.freeze(EmojiSetPickOne.prototype);