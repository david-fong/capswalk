import { Lang } from "../Lang";

export namespace Numpad {
	/**
	 * # Number Pad
	 */
	export class Numpad extends Lang {
		public constructor(weightScaling: number) {
			super("numpad", weightScaling);
		}
		public static BUILD(): Lang.WeightedForwardMap {
			const dict: Lang.WeightedForwardMap = {};
			for (let i = 0; i < 100; i++) {
				const str = i.toString().padStart(2,"0");
				dict[str] = { seq: str, weight: 1 };
			}
			return dict;
		}
	}
	Numpad as Lang.ClassIf;
	Object.freeze(Numpad);
	Object.freeze(Numpad.prototype);
}
Object.freeze(Numpad);