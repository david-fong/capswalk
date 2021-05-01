import { JsUtils } from ":defs/JsUtils";
import type { Coord, Tile } from ":floor/Tile";
import type { Grid as AbstractGrid } from ":floor/Grid";
import type { Player } from ":defs/TypeDefs";
import { VisibleGrid } from "../VisibleGrid";

import { IAC, WrappedEuclid2 as System } from ":floor/impl/Euclid2";
import style from "./Euclid2.m.css";
type S = Coord.System.W_EUCLID2;
const PHYSICAL_TILE_WIDTH = 3.3;

// TODO.wait when rx, x, y, height, and width are widely supported by CSS,
// use them for the square shapes instead of setting attributes.

// Design Note: Using SVG patterns or <use> to implement mirroring was
// considered, but dropped due to browser implementations not being very
// efficient for changing defs. Being more imperative saves CPU power.

/** */
const ID = Object.freeze(<const>{
	tilePattern: "tile-pattern",
});

/** helper */
function setAttrs(el: Element, attrs: Record<string, string | number>): void {
	for (const key in attrs) {
		el.setAttribute(key, attrs[key] as string);
	}
}

/** */
function _mkGridDefs(): SVGDefsElement {
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
	}
	return defs;
}

/** */
function _mkMirroredChars(iac: IAC.Bare, dim: System.Grid.Dimensions): readonly SVGTextElement[] {
	const { height: h, width: w } = dim;
	const chars = [JsUtils.svg("text"), JsUtils.svg("text"), JsUtils.svg("text"), JsUtils.svg("text")];
	setAttrs(chars[0]!, { x:   iac.x + 0.5, y:   iac.y + 0.5 });
	setAttrs(chars[1]!, { x: w+iac.x + 0.5, y:   iac.y + 0.5 });
	setAttrs(chars[2]!, { x:   iac.x + 0.5, y: h+iac.y + 0.5 });
	setAttrs(chars[3]!, { x: w+iac.x + 0.5, y: h+iac.y + 0.5 });
	return chars;
}

/** */
function __mkPlayer(desc: Player.UserInfo): SVGGElement {
	const player = JsUtils.svg("g"); setAttrs(player, {
		height: 1, width: 1, viewBox: "0,0,1,1",
	}); {
		const back = JsUtils.svg("rect", [style["tile"]]);
		setAttrs(back, { height: 0.8, width: 0.8, x: 0.1, y: 0.1, rx: 0.1 });
		player.appendChild(back);
	} {
		const code = [...desc.avatar]
			.map((c) => c.codePointAt(0)!.toString(16))
			.slice(0,-1) // remove the "variant-16 code point"
			.join("-");
		const emoji = JsUtils.svg("image"); setAttrs(emoji, {
			href: `https://twemoji.maxcdn.com/v/latest/svg/${code}.svg`,
			height: 1, width: 1, alt: desc.avatar,
		});
		player.appendChild(emoji);
	}
	return player;
}
const _offsetUnits = ([[0,0],[0,1],[1,0],[1,1]] as [x: number, y: number][]).freeze();
/** */
function _mkMirroredPlayers(dim: System.Grid.Dimensions, desc: Player.UserInfo): SVGGElement {
	const players = JsUtils.svg("g", [style["player"]]); setAttrs(players, {
		height: dim.height+1, width: dim.width+1,
	});
	_offsetUnits.forEach((offsetUnits) => {
		const p = __mkPlayer(desc);
		p.setAttribute("transform", `translate(${offsetUnits[0]*dim.width} ${offsetUnits[1]*dim.height})`);
		players.appendChild(p);
	});
	return players;
}

/**
 * @final
 */
export class Euclid2VisibleGrid extends System.Grid implements VisibleGrid<S> {

	public readonly baseElem: HTMLElement;
	public readonly spotlightElems: readonly HTMLElement[];
	public readonly players: readonly SVGGElement[];
	#chars: readonly (readonly SVGTextElement[])[];

	public constructor(desc: AbstractGrid.CtorArgs<S>) {
		super(desc);

		const dim = desc.dimensions;
		const svg = JsUtils.svg("svg", [style["grid"]]); setAttrs(svg, {
			height: `${PHYSICAL_TILE_WIDTH*dim.height}em`,
			width:  `${PHYSICAL_TILE_WIDTH*dim.width }em`,
			// viewBox: `0, 0, ${2*dim.width}, ${2*dim.height}`,
			viewBox: `${0.5*dim.width}, ${0.5*dim.height}, ${1.5*dim.width}, ${1.5*dim.height}`,
		});
		svg.appendChild(_mkGridDefs());
		{
			const tiles = JsUtils.svg("rect"); setAttrs(tiles, {
				height: "100%", width: "100%", x: `${0.5*dim.width}`, y: `${0.5*dim.height}`,
				fill: `url(#${ID.tilePattern})`, role: "presentation",
			});
			svg.appendChild(tiles);
		} {
			// Mirrored Grid of Characters
			const allChars = JsUtils.svg("g", [style["char"]]); setAttrs(allChars, {}); {
				// Language Characters
				const thisChars: (readonly SVGTextElement[])[] = [];
				this.forEach((tile) => {
					const mcs = _mkMirroredChars(this.iacCache[tile.coord]!, dim);
					thisChars.push(mcs);
					mcs.forEach((c) => allChars.appendChild(c));
				});
				this.#chars = thisChars.freeze();
			}
			allChars.style.setProperty("--font-scaling", ""+desc.langCharFontScaling);
			svg.appendChild(allChars);
		}
		// Note: using a separate SVG for the players causes the repaint
		// area with animations to be more constrained in Chrome browser.
		const players = svg.cloneNode() as SVGSVGElement;
		players.style.position = "absolute";
		players.style.top = "0";
		this.players = desc.players.map(_mkMirroredPlayers.bind(null, dim)).freeze();
		this.players.forEach((p) => players.appendChild(p));

		const wrapper = JsUtils.html("div");
		wrapper.appendChild(svg);
		wrapper.appendChild(players);
		Object.assign(this, VisibleGrid._mkExtensionProps(wrapper));
		Object.seal(this); //🧊
	}

	/** @override */
	public write(coord: Coord, changes: Tile.Changes): void {
		super.write(coord, changes);
		if (changes.char) {
			this.#chars[coord]!.forEach((c) => c.textContent = changes.char!);
		}
	}

	/** @override */
	public moveEntity(entityId: Player.Id, _from: Coord, _to: Coord): void {
		super.moveEntity(entityId, _from, _to);
		const p = this.players[entityId]!;
		const dim = this.dimensions;
		const from = this.iacCache[_from]!;
		const to = this.iacCache[_to]!;
		const wrap = IAC.wrapInfo(dim, from, to);
		if (wrap.x || wrap.y) {
			p.style.transition = "none";
			p.setAttribute("transform", `translate(${from.x + (dim.width*wrap.x)} ${from.y + (dim.height*wrap.y)})`);
			setTimeout(() => {
				// For some reason the style recalculation isn't registered
				// in Chrome browser within the same event stack.
				p.style.transition = "";
				p.setAttribute("transform", `translate(${to.x} ${to.y})`);
			}, 0);
		} else {
			p.setAttribute("transform", `translate(${to.x} ${to.y})`);
		}
	}
}
Object.freeze(Euclid2VisibleGrid);
Object.freeze(Euclid2VisibleGrid.prototype);