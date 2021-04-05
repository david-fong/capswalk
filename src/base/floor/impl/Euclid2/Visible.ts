import { JsUtils } from "defs/JsUtils";
import type { Coord, Tile } from "floor/Tile";
import type { Grid as AbstractGrid } from "floor/Grid";
import { VisibleGrid } from "floor/visible/VisibleGrid";
import { Player } from "defs/TypeDefs";

import { WrappedEuclid2 as System } from "./System";
import style from "./style.m.css";
type S = Coord.System.W_EUCLID2;
const WIDTH = 1.4; // <- must be set to match the stylesheet values.
const GAP = 0.25;

/** */
function setAttrs(el: Element, attrs: Record<string, string>): void {
	for (const key in attrs) {
		el.setAttribute(key, attrs[key]!);
	}
}

/** */
class VisibleTile {

	public readonly _char = JsUtils.svg("text");

	constructor(iac: System.Grid["iacCache"][number]) {
		const char = this._char;
		char.classList.add(style.char);
		char.setAttributeNS(null, "x", (iac.x+(0.5)) as unknown as string);
		char.setAttributeNS(null, "y", (iac.y+(0.5)) as unknown as string);
	}
	public set char(char: string) {
		this._char.textContent = char;
	}
}
Object.freeze(VisibleTile);
Object.freeze(VisibleTile.prototype);

/**
 * @final
 */
export class Euclid2VisibleGrid extends System.Grid implements VisibleGrid<S> {

	public readonly baseElem: HTMLElement;
	public readonly spotlightElems: readonly HTMLElement[];
	public readonly players: readonly SVGGElement[];
	#tiles: readonly VisibleTile[];

	public constructor(desc: AbstractGrid.CtorArgs<S>) {
		super(desc);

		const dim = desc.dimensions;
		const svg = JsUtils.svg("svg", [style["grid"]]); setAttrs(svg, {
			height: `${2*(WIDTH+GAP)*dim.height}em`,
			width:  `${2*(WIDTH+GAP)*dim.width }em`,
			viewBox: `0, 0, ${dim.width}, ${dim.height}`,
			preserveAspectRatio: "xMidYMid meet",
		});
		const defs = JsUtils.svg("defs");
		{
			const pattern = JsUtils.svg("pattern"); setAttrs(pattern, {
				id: "tile-back-pattern", patternUnits: "userSpaceOnUse",
				height: "1", width: "1", viewBox: "0,0,1,1",
			});
			const t = JsUtils.svg("rect", [style["tile"]]);
			setAttrs(t, { height: "0.8", width: "0.8" });

			pattern.appendChild(t);
			defs.appendChild(pattern);
		} {
			const mirror = JsUtils.svg("pattern"); setAttrs(mirror, {
				id: "grid-mirror",
				height: "50%", width: "50%",
				viewBox: `0, 0, ${dim.width}, ${dim.height}`,
			}); {
				const back = JsUtils.svg("rect"); setAttrs(back, {
					height: "100%", width: "100%",
					fill: "url(#tile-back-pattern)",
				});
				mirror.appendChild(back);
			} {
				const tiles: VisibleTile[] = [];
				this.forEach((tile) => {
					const v = new VisibleTile(this.iacCache[tile.coord]!);
					tiles.push(v);
					mirror.appendChild(v._char);
				});
				this.#tiles = tiles;
			}
			this.players = desc.players.map((desc) => {
				const svg = JsUtils.svg("g", [style["player"]]); setAttrs(svg, {
					height: "1", width: "1", viewBox: "0,0,1,1",
				});
				{
					const back = JsUtils.svg("rect", [style["tile"]]);
					setAttrs(back, { height: "0.8", width: "0.8" });
					svg.appendChild(back);
				}
				const avatar = JsUtils.svg("text", [style["char"]], {
					textContent: desc.avatar,
				}); setAttrs(avatar, {
					x: "0.5", y: "0.5",
				});
				svg.appendChild(avatar);
				mirror.appendChild(svg);
				return svg;
			}).freeze();

			defs.appendChild(mirror);
		}
		svg.appendChild(defs);
		{
			const plane = JsUtils.svg("rect"); setAttrs(plane, {
				height: "100%", width: "100%",
				fill: "url(#grid-mirror)",
			});
			svg.appendChild(plane);
		}

		const wrapper = JsUtils.html("div");
		wrapper.appendChild(svg);
		Object.assign(this, VisibleGrid._mkExtensionProps(wrapper));
		Object.seal(this); //🧊
	}

	/** @override */
	public write(coord: Coord, changes: Tile.Changes): void {
		super.write(coord, changes);
		const tile = this.#tiles[coord]!;
		if (changes.char) {
			tile.char = changes.char!;
		}
		if (changes.occId !== undefined && changes.occId !== Player.Id.NULL) {
			const p = this.players[changes.occId!]!;
			const iac = this.iacCache[coord]!;
			setAttrs(p, {
				transform: `translate(${iac.x} ${iac.y})`,
			});
		}
	}
}
Object.freeze(Euclid2VisibleGrid);
Object.freeze(Euclid2VisibleGrid.prototype);