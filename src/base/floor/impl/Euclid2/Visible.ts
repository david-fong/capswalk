import { JsUtils } from "defs/JsUtils";
import type { Player } from "defs/TypeDefs";
import type { Coord, Tile } from "floor/Tile";
import type { Grid as AbstractGrid } from "floor/Grid";
import { VisibleGrid } from "floor/visible/VisibleGrid";

import { WrappedEuclid2 as System } from "./System";
import style, { tile } from "./style.m.css";
type S = Coord.System.W_EUCLID2;
const WIDTH = 1.4; // <- must be set to match the stylesheet values.
const GAP = 0.25;

/** */
class VisibleTile implements TU.Pikk<Tile,|"health"> {

	public readonly _char = JsUtils.svg("text");

	constructor(iac: System.Grid["iacCache"][number]) {
		const char = this._char;
		char.classList.add(style.char);
		char.setAttributeNS(null, "x", (iac.x+(0.5))+"");
		char.setAttributeNS(null, "y", (iac.y+(0.5))+"");
	}
	public set health(health: Player.Health) {
		// TODO.design hm... now that I'm tiling things, this will be harder.
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

	readonly baseElem: HTMLElement;
	readonly spotlightElems: ReadonlyArray<HTMLElement>;
	#tiles: ReadonlyArray<VisibleTile>;

	public constructor(desc: AbstractGrid.CtorArgs<S>) {
		super(desc);

		const svg = JsUtils.svg("svg", [style["grid"]]);
		const dim = desc.dimensions;
		{
			svg.setAttribute("height", (2*(WIDTH+GAP)*dim.height)+"em");
			svg.setAttribute("width",  (2*(WIDTH+GAP)*dim.width )+"em");
			svg.setAttribute("viewBox", `0, 0, ${dim.width}, ${dim.height}`);
			svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
		}
		const defs = JsUtils.svg("defs");
		svg.appendChild(defs);
		{
			const t = JsUtils.svg("rect");
			t.classList.add(style.tile);
			t.setAttribute("x", "0.1");
			t.setAttribute("y", "0.1");
			t.setAttribute("height", "0.8");
			t.setAttribute("width",  "0.8");

			const pattern = JsUtils.svg("pattern");
			pattern.id = "tile-back-pattern";
			pattern.setAttribute("viewBox", "0,0,1,1");
			pattern.setAttribute("height", `calc(100%/${dim.height})`);
			pattern.setAttribute("width",  `calc(100%/${dim.width})`);
			pattern.appendChild(t);
			defs.appendChild(pattern);
		} {
			const mirror = JsUtils.svg("pattern");
			mirror.id = "grid-mirror";
			mirror.setAttribute("height", "50%");
			mirror.setAttribute("width",  "50%");
			mirror.setAttribute("viewBox", `0, 0, ${dim.width}, ${dim.height}`);

			const back = JsUtils.svg("rect");
			back.setAttribute("height", "100%");
			back.setAttribute("width",  "100%");
			back.setAttribute("fill", "url(#tile-back-pattern)");
			mirror.appendChild(back);

			const tiles: Array<VisibleTile> = [];
			this.forEach((tile) => {
				const v = new VisibleTile(this.iacCache[tile.coord]!);
				tiles.push(v);
				mirror.appendChild(v._char);
			});
			defs.appendChild(mirror);
			this.#tiles = tiles;
		} {
			const plane = JsUtils.svg("rect");
			plane.setAttribute("height", "100%");
			plane.setAttribute("width",  "100%");
			plane.setAttribute("fill", "url(#grid-mirror)");
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
		if (JsUtils.hasProp(changes, "occId")) {
			// TODO.impl
		}
		if (changes.health) {
			tile.health = changes.health!;
		}
		if (changes.char) {
			tile.char = changes.char!;
		}
	}
}
Object.freeze(Euclid2VisibleGrid);
Object.freeze(Euclid2VisibleGrid.prototype);