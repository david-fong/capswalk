import { JsUtils } from "defs/JsUtils";
import type { Coord, Tile } from "floor/Tile";
import type { Grid as AbstractGrid } from "floor/Grid";
import { VisibleGrid } from "floor/visible/VisibleGrid";
import { Player } from "defs/TypeDefs";

import { WrappedEuclid2 as System } from "./System";
import style from "./style.m.css";
type S = Coord.System.W_EUCLID2;
const PHYSICAL_TILE_WIDTH = 3.3;

//

/** */
function setAttrs(el: Element, attrs: Record<string, string|number>): void {
	for (const key in attrs) {
		el.setAttribute(key, attrs[key] as string);
	}
}

/** */
class VisibleTile {

	public readonly _char = JsUtils.svg("text");

	constructor(iac: System.Grid["iacCache"][number]) {
		const char = this._char;
		char.classList.add(style.char);
		setAttrs(char, {
			x: iac.x + 0.5, y: iac.y + 0.5,
		});
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
			height: `${PHYSICAL_TILE_WIDTH*dim.height}em`,
			width:  `${PHYSICAL_TILE_WIDTH*dim.width }em`,
			viewBox: `0, 0, ${dim.width}, ${dim.height}`,
		});
		const defs = JsUtils.svg("defs");
		{
			// Tile Pattern
			const pattern = JsUtils.svg("pattern"); setAttrs(pattern, {
				id: "tile-back-pattern", patternUnits: "userSpaceOnUse",
				height: "1", width: "1", viewBox: "0,0,1,1",
			});
			const t = JsUtils.svg("rect", [style["tile"]]);
			setAttrs(t, { height: 0.8, width: 0.8, x: 0.1, y: 0.1, rx: 0.1 });

			pattern.appendChild(t);
			defs.appendChild(pattern);
		} {
			// Mirrored Grid of Characters
			const mirror = JsUtils.svg("pattern"); setAttrs(mirror, {
				id: "grid-mirror", "z-index": "0",
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
					height: 1, width: 1, viewBox: "0,0,1,1",
				});
				{
					const back = JsUtils.svg("rect", [style["tile"]]);
					setAttrs(back, { height: 0.8, width: 0.8, x: 0.1, y: 0.1, rx: 0.1 });
					svg.appendChild(back);
				} /* {
					const avatar = JsUtils.svg("text", [style["char"]], {
						textContent: desc.avatar,
					}); setAttrs(avatar, {
						x: "0.5", y: "0.5",
					});
					svg.appendChild(avatar);
				} */ {
					const code = [...desc.avatar]
						.map((c) => c.codePointAt(0)!.toString(16))
						.slice(0,-1) // remove the "variant-16 code point"
						.join("-");
					const twemoji = JsUtils.svg("image"); setAttrs(twemoji, {
						href: `https://twemoji.maxcdn.com/v/latest/svg/${code}.svg`,
						height: 1, width: 1,
					});
					svg.appendChild(twemoji);
				}

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