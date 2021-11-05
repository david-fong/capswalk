import { JsUtils } from ":defs/JsUtils";
import { StorageHooks } from "::StorageHooks";
import type { Coord, Tile } from ":floor/Tile";
import type { Grid as AbstractGrid } from ":floor/Grid";
import type { Player } from ":defs/TypeDefs";
import { VisibleGrid } from "../VisibleGrid";

import { IAC, WrappedEuclid2 as System } from ":floor/impl/Euclid2";
import style from "./Euclid2.m.css";
type S = Coord.System.W_EUCLID2;
const PHYSICAL_TILE_WIDTH = 2.6;
const SPOTLIGHT_RADIUS = 7;

// TODO.wait when rx, x, y, height, and width are widely supported by CSS,
// use them for the square shapes instead of setting attributes.

// Design Note: Using SVG patterns or <use> to implement mirroring was
// considered, but dropped due to browser implementations not being very
// efficient for changing defs. Being more imperative saves CPU power.

/** */
const ID = Object.freeze(<const>{
	tilePattern: "tile-pattern",
	spotlightGradient: "spotlight-gradient",
	spotlightMask: "spotlight-mask",
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
	const pattern = JsUtils.svg("pattern"); setAttrs(pattern, {
		id: ID.tilePattern, patternUnits:"userSpaceOnUse",
		height:"1", width:"1", viewBox:"0,0,1,1",
	});
	const t = JsUtils.svg("rect", [style["tile"]]);
	setAttrs(t, { height: 0.8, width: 0.8, x: 0.1, y: 0.1, rx: 0.1 });
	pattern.appendChild(t);
	defs.appendChild(pattern);
	return defs;
}

/** */
function _mkMirroredChars(iac: IAC.Bare, dim: System.Grid.Dimensions): readonly SVGTextElement[] {
	// TODO.design different kinds of wrapping. Don't create nodes that will never be displayed.
	const { height: h, width: w } = dim;
	const copies = [JsUtils.svg("text"), JsUtils.svg("text"), JsUtils.svg("text"), JsUtils.svg("text")].freeze();
	setAttrs(copies[0]!, { x:   iac.x + 0.5, y:   iac.y + 0.5 });
	setAttrs(copies[1]!, { x: w+iac.x + 0.5, y:   iac.y + 0.5 });
	setAttrs(copies[2]!, { x:   iac.x + 0.5, y: h+iac.y + 0.5 });
	setAttrs(copies[3]!, { x: w+iac.x + 0.5, y: h+iac.y + 0.5 });
	return copies;
}

/** */
function __mkPlayer(desc: Player.UserInfo): SVGGElement {
	const player = JsUtils.svg("g"); setAttrs(player, {
		height: 1, width: 1, viewBox: "0,0,1,1",
	}); {
		/* const back = JsUtils.svg("rect", [style["tile"]]);
		setAttrs(back, { height: 0.8, width: 0.8, x: 0.1, y: 0.1, rx: 0.1 });
		player.appendChild(back); */
	}{
		switch (StorageHooks.Local.emojiFont) {
		case "system": {
			const emoji = JsUtils.svg("text", [style["char"]], { textContent: desc.avatar });
			setAttrs(emoji, { x: 0.5, y: 0.5 });
			player.appendChild(emoji);
			break;
		}
		case "twemoji": {
			const code = [...desc.avatar]
				.map((c) => c.codePointAt(0)!.toString(16))
				.slice(0,-1) // remove the "variant-16 code point"
				.join("-");
			const emoji = JsUtils.svg("image"); setAttrs(emoji, {
				href: `https://twemoji.maxcdn.com/v/latest/svg/${code}.svg`,
				height: 1, width: 1, alt: desc.avatar,
			});
			player.appendChild(emoji);
			break;
		}
		default: throw new Error("never");
		}
	}
	return player;
}
const _offsetUnits = ([[0,0],[1,0],[0,1],[1,1]] as [x: number, y: number][]).freeze();
/** */
function _mkMirroredPlayers(dim: System.Grid.Dimensions, desc: Player.UserInfo): SVGGElement {
	const copies = JsUtils.svg("g", [style["player"]]);
	if (StorageHooks.Local.moreAnimations) { copies.classList.add(style["animated-entity"]); }
	_offsetUnits.forEach((ou) => {
		const p = __mkPlayer(desc);
		p.setAttribute("transform", `translate(${ou[0]*dim.width} ${ou[1]*dim.height})`);
		copies.appendChild(p);
	});
	return copies;
}

/** */
function _mkSpotlight(dim: System.Grid.Dimensions): SVGDefsElement {
	const defs = JsUtils.svg("defs");
	{
		const gradient = JsUtils.svg("radialGradient");
		gradient.id = ID.spotlightGradient;
		gradient.append(...[{ o:10, a:"F" }, { o:40, a:"6" }, { o:70, a:"1" }, { o:100, a:"0" }].map((desc) => {
			const stop = JsUtils.svg("stop"); setAttrs(stop, {
				offset:`${desc.o}%`, "stop-color":`#000${desc.a}`,
			});
			return stop;
		}));
		defs.appendChild(gradient);
	}{
		const mask = JsUtils.svg("mask"); mask.id = ID.spotlightMask;
		{
			const copies = JsUtils.svg("g", [style["spotlight"]]);
			if (StorageHooks.Local.moreAnimations) { copies.classList.add(style["animated-entity"]); }
			{
				const fill = JsUtils.svg("rect"); setAttrs(fill, {
					fill:"#FFF", height:""+(3*dim.height), width:""+(3*dim.width), x:""+(-dim.width), y:""+(-dim.width)
				});
				copies.appendChild(fill);
			}
			_offsetUnits.forEach((ou) => {
				const r = SPOTLIGHT_RADIUS;
				const rect = JsUtils.svg("rect"); setAttrs(rect, {
					fill: `url(#${ID.spotlightGradient})`,
					x: -r, y: -r, height: 2*r+1, width: 2*r+1,
				});
				rect.setAttribute("transform", `translate(${ou[0]*dim.width} ${ou[1]*dim.height})`);
				copies.appendChild(rect);
			});
			mask.appendChild(copies);
		}
		defs.appendChild(mask);
	}
	return defs;
}

/**
 * @final
 */
export class Euclid2VisibleGrid extends System.Grid implements VisibleGrid<S> {

	public readonly baseElem: HTMLElement;
	private readonly spotlight: SVGGElement;
	private readonly players: readonly SVGGElement[];
	#focusedPlayerId = 0;
	#chars: readonly (readonly SVGTextElement[])[];
	private readonly moreAnimations = StorageHooks.Local.moreAnimations;

	public constructor(desc: AbstractGrid.CtorArgs<S>) {
		super(desc);
		const dim = desc.dimensions;
		const marginX = (typeof dim._render.wrapX === "number") ? dim._render.wrapX : 0;
		const marginY = (typeof dim._render.wrapY === "number") ? dim._render.wrapY : 0;
		const wrapper = JsUtils.html("div");
		// Note: using a separate SVG for the layers causes the repaint
		// area with animations to be more constrained in Chrome browser.
		{
			// Character Grid Layer ===
			const layer = JsUtils.svg("svg", [style["grid"]]); setAttrs(layer, {
				height: `${PHYSICAL_TILE_WIDTH/((desc.langCharFontScaling-1)/2+1)*dim.height}em`,
				width:  `${PHYSICAL_TILE_WIDTH/((desc.langCharFontScaling-1)/2+1)*dim.width }em`,
				// viewBox: `0, 0, ${2*dim.width}, ${2*dim.height}`,
				viewBox: `${dim.width/2-marginX}, ${dim.height/2-marginY},
					${2*marginX+dim.width}, ${2*marginY+dim.height}`,
			});
			layer.appendChild(_mkGridDefs());
			{
				const tiles = JsUtils.svg("rect"); setAttrs(tiles, {
					height:"100%", width:"100%", x:`${dim.width/2-marginX}`, y:`${dim.height/2-marginY}`,
					fill:`url(#${ID.tilePattern})`, role:"presentation",
				});
				layer.appendChild(tiles);
			}{
				// Mirrored Grid of Characters
				const allChars = JsUtils.svg("g", [style["char"]]); {
					// Language Characters
					const thisChars: (readonly SVGTextElement[])[] = [];
					this.forEach((tile) => {
						const mcs = _mkMirroredChars(this.iacCache[tile.coord]!, dim);
						thisChars.push(mcs);
						allChars.append(...mcs);
					});
					this.#chars = thisChars.freeze();
				}
				allChars.style.setProperty("--font-scaling", ""+desc.langCharFontScaling);
				layer.appendChild(allChars);
			}
			wrapper.appendChild(layer);
		}{
			// Spotlight Layer ===
			const layer = wrapper.firstElementChild!.cloneNode() as SVGSVGElement;
			layer.style.position = "absolute";
			// layer.style.willChange = "transform";
			layer.appendChild(_mkSpotlight(dim));
			{
				const fill = JsUtils.svg("rect"); setAttrs(fill, {
					fill:"var(--colour-mainBg)", mask:`url(#${ID.spotlightMask})`,
					height:"100%", width:"100%", x:`${dim.width/2-marginX}`, y:`${dim.height/2-marginY}`,
				});
				layer.appendChild(fill);
			}
			this.spotlight = layer.getElementById(ID.spotlightMask)
				.getElementsByClassName(style["spotlight"])
				.item(0) as SVGGElement;
			wrapper.appendChild(layer);
		}{
			// Players Layer ===
			const layer = wrapper.firstElementChild!.cloneNode() as SVGSVGElement;
			layer.style.position = "absolute";
			this.players = desc.players.map(_mkMirroredPlayers.bind(null, dim)).freeze();
			layer.append(...this.players);
			wrapper.appendChild(layer);
		}
		Object.assign(this, VisibleGrid._mkExtensionProps(wrapper));
		Object.seal(this); //🧊
	}

	public override write(coord: Coord, changes: Tile.Changes): void {
		super.write(coord, changes);
		if (changes.char) {
			this.#chars[coord]!.forEach((c) => c.textContent = changes.char!);
		}
	}

	public override renderChangeOperatedPlayer(playerId: Player.Id, coord: Coord, prevPlayerCoord: Coord | undefined): void {
		this.#focusedPlayerId = playerId;
		this.moveEntity(playerId, prevPlayerCoord ?? 0, coord, true);
	}

	public override moveEntity(entityId: Player.Id, _from: Coord, _to: Coord, spotlightOnly = false): void {
		if (!spotlightOnly) super.moveEntity(entityId, _from, _to);
		const p = this.players[entityId]!;
		const dim = this.dimensions;
		const from = this.iacCache[_from]!;
		const to   = this.iacCache[_to]!;
		const wrap = IAC.wrapInfo(dim, from, to);
		const doSpot = entityId === this.#focusedPlayerId;
		if (this.moreAnimations && ((dim._render.wrapX && wrap.x) || (dim._render.wrapY && wrap.y))) {
			const transform = `translate(${from.x + (dim.width*wrap.x)} ${from.y + (dim.height*wrap.y)})`;
			p.style.transition = "none";
			if (!spotlightOnly) p.setAttribute("transform", transform);
			if (doSpot) {
				this.spotlight.style.transition = "none";
				this.spotlight.setAttribute("transform", transform);
			}
			setTimeout(() => {
				// For some reason the style recalculation isn't registered in Chrome
				// browser within the same event stack? or it just needs some delay?
				const transform = `translate(${to.x} ${to.y})`;
				p.style.transition = "";
				p.setAttribute("transform", transform);
				if (doSpot) {
					this.spotlight.style.transition = "";
					this.spotlight.setAttribute("transform", transform);
				}
			},10);
		} else {
			const transform = `translate(${to.x} ${to.y})`;
			p.setAttribute("transform", transform);
			if (doSpot) this.spotlight.setAttribute("transform", transform);
		}
	}
}
Object.freeze(Euclid2VisibleGrid);
Object.freeze(Euclid2VisibleGrid.prototype);