import { JsUtils } from "defs/JsUtils";
import type { Coord, Tile } from "floor/Tile";
import type { Grid as AbstractGrid } from "floor/Grid";
import type { Player } from "defs/TypeDefs";
import { VisibleGrid } from "floor/visible/VisibleGrid";

import { WrappedEuclid2 as System } from "./System";
import style from "./style.m.css";
type S = Coord.System.W_EUCLID2;
const PHYSICAL_TILE_WIDTH = 3.3;

// TODO.wait when rx, x, y, height, and width are widely supported by CSS,
// use them for the square shapes instead of setting attributes.

/** */
const ID = Object.freeze(<const>{
	tilePattern: "tile-pattern",
	gridMirror: "grid-mirror",
	player(id: number) { return "player-avatar-" + id; },
});

/** helper */
function setAttrs(el: Element, attrs: Record<string, string | number>): void {
	for (const key in attrs) {
		el.setAttribute(key, attrs[key] as string);
	}
}

/** */
function _mkChar(iac: System.Grid["iacCache"][number]): SVGTextElement {
	const char = JsUtils.svg("text");
	char.classList.add(style.char);
	setAttrs(char, {
		x: iac.x + 0.5, y: iac.y + 0.5,
	});
	return char;
}

/** */
function _mkPlayer(desc: Player.UserInfo): SVGGElement {
	const player = JsUtils.svg("g", [style["player"]]); setAttrs(player, {
		height: 1, width: 1, viewBox: "0,0,1,1",
	}); {
		const back = JsUtils.svg("rect", [style["tile"]]);
		setAttrs(back, { height: 0, width: 0, x: 0.1, y: 0.1, rx: 0.1 });
		player.appendChild(back);
	} {
		const code = [...desc.avatar]
			.map((c) => c.codePointAt(0)!.toString(16))
			.slice(0,-1) // remove the "variant-16 code point"
			.join("-");
		const emoji = JsUtils.svg("image"); setAttrs(emoji, {
			href: `https://twemoji.maxcdn.com/v/latest/svg/${code}.svg`,
			height: 1, width: 1,
		});
		player.appendChild(emoji);
	}
	return player;
}

/**
 * @final
 */
export class Euclid2VisibleGrid extends System.Grid implements VisibleGrid<S> {

	public readonly baseElem: HTMLElement;
	public readonly spotlightElems: readonly HTMLElement[];
	public readonly players: readonly SVGGElement[];
	#chars: readonly SVGTextElement[];

	public constructor(desc: AbstractGrid.CtorArgs<S>) {
		super(desc);

		const dim = desc.dimensions;
		const svg = JsUtils.svg("svg", [style["grid"]]); setAttrs(svg, {
			height: `${PHYSICAL_TILE_WIDTH*dim.height}em`,
			width:  `${PHYSICAL_TILE_WIDTH*dim.width }em`,
			viewBox: `0, 0, ${dim.width}, ${dim.height}`,
		});
		const defs = this._mkGridDefs();
		svg.appendChild(defs);
		{
			const plane = JsUtils.svg("use"); setAttrs(plane, {
				height: "100%", width: "100%",
				href: `#${ID.gridMirror}`,
			});
			svg.appendChild(plane);
		}
		this.players = desc.players.map(_mkPlayer).freeze();
		this.players.forEach((p) => svg.appendChild(p));

		const wrapper = JsUtils.html("div");
		wrapper.appendChild(svg);
		Object.assign(this, VisibleGrid._mkExtensionProps(wrapper));
		Object.seal(this); //🧊
	}

	/** @override */
	public write(coord: Coord, changes: Tile.Changes): void {
		super.write(coord, changes);
		if (changes.char) {
			console.log(coord)
			this.#chars[coord]!.textContent = changes.char!;
		}
	}

	/** @override */
	public moveEntity(entityId: Player.Id, from: Coord, to: Coord): void {
		super.moveEntity(entityId, from, to);
		const p = this.players[entityId]!;
		const iac = this.iacCache[to]!;
		setAttrs(p, {
			//transform: `translate(${iac.x} ${iac.y})`,
		});
	}

	/** */
	private _mkGridDefs(): SVGDefsElement {
		const defs = JsUtils.svg("defs");
		{
			// Tile Pattern
			const pattern = JsUtils.svg("pattern"); setAttrs(pattern, {
				id: ID.tilePattern, patternUnits: "userSpaceOnUse",
				height: "1", width: "1", viewBox: "0,0,1,1",
			});
			const t = JsUtils.svg("rect", [style["tile"]]);
			setAttrs(t, { height: 0.8, width: 0.8, x: 0.1, y: 0.1, rx: 0.1 });

			pattern.appendChild(t);
			defs.appendChild(pattern);
		} {
			// Mirrored Grid of Characters
			const grid = JsUtils.svg("symbol"); setAttrs(grid, {
				id: ID.gridMirror, "z-index": "0",
				height: "50%", width: "50%",
				viewBox: `0, 0, ${this.dimensions.width}, ${this.dimensions.height}`,
			}); {
				const back = JsUtils.svg("rect"); setAttrs(back, {
					height: "100%", width: "100%",
					fill: `url(#${ID.tilePattern})`,
				});
				grid.appendChild(back);
			} {
				// Language Characters
				const chars: SVGTextElement[] = [];
				this.forEach((tile) => {
					const v = _mkChar(this.iacCache[tile.coord]!);
					chars.push(v);
					grid.appendChild(v);
				});
				this.#chars = chars.freeze();
			}
			defs.appendChild(grid);
		}
		return defs;
	}
}
Object.freeze(Euclid2VisibleGrid);
Object.freeze(Euclid2VisibleGrid.prototype);