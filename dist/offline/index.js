/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	function webpackJsonpCallback(data) {
/******/ 		var chunkIds = data[0];
/******/ 		var moreModules = data[1];
/******/ 		var executeModules = data[2];
/******/
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, resolves = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(Object.prototype.hasOwnProperty.call(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 				resolves.push(installedChunks[chunkId][0]);
/******/ 			}
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(data);
/******/
/******/ 		while(resolves.length) {
/******/ 			resolves.shift()();
/******/ 		}
/******/
/******/ 		// add entry modules from loaded chunk to deferred list
/******/ 		deferredModules.push.apply(deferredModules, executeModules || []);
/******/
/******/ 		// run deferred modules when all chunks ready
/******/ 		return checkDeferredModules();
/******/ 	};
/******/ 	function checkDeferredModules() {
/******/ 		var result;
/******/ 		for(var i = 0; i < deferredModules.length; i++) {
/******/ 			var deferredModule = deferredModules[i];
/******/ 			var fulfilled = true;
/******/ 			for(var j = 1; j < deferredModule.length; j++) {
/******/ 				var depId = deferredModule[j];
/******/ 				if(installedChunks[depId] !== 0) fulfilled = false;
/******/ 			}
/******/ 			if(fulfilled) {
/******/ 				deferredModules.splice(i--, 1);
/******/ 				result = __webpack_require__(__webpack_require__.s = deferredModule[0]);
/******/ 			}
/******/ 		}
/******/
/******/ 		return result;
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// Promise = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		"offline": 0
/******/ 	};
/******/
/******/ 	var deferredModules = [];
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "dist";
/******/
/******/ 	var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];
/******/ 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
/******/ 	jsonpArray.push = webpackJsonpCallback;
/******/ 	jsonpArray = jsonpArray.slice();
/******/ 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
/******/ 	var parentJsonpFunction = oldJsonpFunction;
/******/
/******/
/******/ 	// add entry module to deferred list
/******/ 	deferredModules.push(["./src/offline/index.ts","client~offline"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/base/floor/Grid.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Grid", function() { return Grid; });
/* harmony import */ var _TileGetter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/base/floor/TileGetter.ts");
/* harmony import */ var _browser_WebHooks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/browser/WebHooks.ts");


class Grid {
    constructor(desc) {
        this.static = desc.gridClass;
        this.dimensions = desc.dimensions;
        this.tile = new _TileGetter__WEBPACK_IMPORTED_MODULE_0__["TileGetter"](this);
    }
    get area() {
        return this.static.getArea(this.dimensions);
    }
    reset() {
        this.forEachTile((tile) => tile.reset());
    }
    check() {
    }
    __VisibleGrid_super(desc, gridElem) {
        const WHG = _browser_WebHooks__WEBPACK_IMPORTED_MODULE_1__["WebHooks"].Grid;
        gridElem.classList.add(WHG.Class.IMPL_BODY);
        const hostElem = document.getElementById(desc.domGridHtmlIdHook);
        if (!hostElem) {
            throw new RangeError(`The ID \"${desc.domGridHtmlIdHook}\"`
                + ` did not refer to an existing html element.`);
        }
        hostElem.dataset[WHG.Dataset.COORD_SYS] = desc.coordSys;
        if (!hostElem.classList.contains(WHG.Class.GRID)) {
            hostElem.classList.add(WHG.Class.GRID);
        }
        {
            let kbdDcIcon = hostElem
                .querySelector(`:scope > .${WHG.Class.KBD_DC_ICON}`);
            if (!kbdDcIcon) {
                kbdDcIcon = document.createElement("div");
                kbdDcIcon.classList.add(WHG.Class.KBD_DC_ICON);
                kbdDcIcon.innerText = "(click grid to continue typing)";
                hostElem.appendChild(kbdDcIcon);
            }
        }
        if (hostElem.tabIndex !== 0) {
            throw new Error("The DOM grid's host must have a tabIndex of zero!"
                + " I want this done directly in the HTML.");
        }
        hostElem.querySelectorAll(`.${WHG.Class.IMPL_BODY}`).forEach((node) => node.remove());
        hostElem.appendChild(gridElem);
        this.hostElem = hostElem;
    }
}
(function (Grid) {
    ;
    Grid.getImplementation = (coordSys) => {
        const ctor = Grid.__Constructors[coordSys];
        return ctor;
    };
})(Grid || (Grid = {}));


/***/ }),

/***/ "./src/base/floor/impl/Beehive.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Beehive", function() { return Beehive; });
/* harmony import */ var _Tile__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/base/floor/Tile.ts");
/* harmony import */ var _Grid__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/base/floor/Grid.ts");


var Beehive;
(function (Beehive) {
    class Coord extends _Tile__WEBPACK_IMPORTED_MODULE_0__["Coord"].Abstract.Mathy {
        constructor(desc) {
            super(desc);
            this.dash = desc.dash;
            this.bash = desc.bash;
            Object.freeze(this);
        }
        equals(other) {
            return (this.dash === other.dash) && (this.bash === other.bash);
        }
        round() {
            const floorDash = Math.floor(this.dash);
            const floorBash = Math.floor(this.bash);
            const d = floorDash - this.dash;
            const b = floorBash - this.bash;
            if (d > 2 * b) {
                return new Coord({ dash: floorDash + 1, bash: floorBash, });
            }
            else if (d < 0.5 * b) {
                return new Coord({ dash: floorDash, bash: floorBash + 1, });
            }
            else if (Math.min(d, b) > 0.5) {
                return new Coord({ dash: floorDash + 1, bash: floorBash + 1, });
            }
            else {
                return new Coord({ dash: floorDash, bash: floorBash, });
            }
        }
        add(other) {
            return new Coord({
                dash: this.dash + other.dash,
                bash: this.bash + other.bash,
            });
        }
        sub(other) {
            return new Coord({
                dash: this.dash - other.dash,
                bash: this.bash - other.bash,
            });
        }
        mul(scalar) {
            return new Coord({
                dash: scalar * this.dash,
                bash: scalar * this.bash,
            });
        }
    }
    Beehive.Coord = Coord;
    Object.freeze(Coord);
    Object.freeze(Coord.prototype);
    class Grid extends _Grid__WEBPACK_IMPORTED_MODULE_1__["Grid"] {
        constructor(desc) {
            super(desc);
        }
        static getAmbiguityThreshold() {
            return 18;
        }
        static getSizeLimits() { return this.SIZE_LIMITS; }
        forEachTile(consumer, thisArg = this) {
            this.grid.forEach((row) => row.forEach((tile) => {
                consumer(tile);
            }, thisArg), thisArg);
        }
        getUntToward(sourceCoord, intendedDest) {
            return undefined;
        }
        __getTileAt(coord) {
            return undefined;
        }
        __getTileDestsFrom(coord) {
            return undefined;
        }
        __getTileSourcesTo(coord) {
            return undefined;
        }
        static getSpawnCoords(playerCounts, dimensions) {
            return undefined;
        }
        static getArea(dim) {
            const shorterSide = Math.min(dim.fslash, dim.bslash);
            const longerSide = Math.max(dim.fslash, dim.bslash);
            const width = (-1) + dim.dash + shorterSide;
            let area = 2 * shorterSide * (dim.dash + width);
            area += (longerSide - shorterSide - 1) * width;
            return area;
        }
        static getRandomCoord(dimensions) {
            return new Coord(undefined);
        }
    }
    Grid.SIZE_LIMITS = Object.freeze({
        dash: Object.freeze({ min: 10, max: 50, }),
        bslash: Object.freeze({ min: 10, max: 50, }),
        fslash: Object.freeze({ min: 10, max: 50, }),
    });
    Beehive.Grid = Grid;
    (function (Grid) {
        class Visible extends Grid {
            constructor(desc) {
                super(desc);
                const domGrid = undefined;
                this.__VisibleGrid_super(desc, domGrid);
            }
        }
        Grid.Visible = Visible;
    })(Grid = Beehive.Grid || (Beehive.Grid = {}));
    Object.freeze(Grid);
    Object.freeze(Grid.prototype);
})(Beehive || (Beehive = {}));
Object.freeze(Beehive);


/***/ }),

/***/ "./src/base/floor/impl/Euclid2.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Euclid2", function() { return Euclid2; });
/* harmony import */ var _Tile__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/base/floor/Tile.ts");
/* harmony import */ var _Grid__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/base/floor/Grid.ts");


var Euclid2;
(function (Euclid2) {
    class Coord extends _Tile__WEBPACK_IMPORTED_MODULE_0__["Coord"].Abstract.Mathy {
        constructor(desc) {
            super(desc);
            this.x = desc.x;
            this.y = desc.y;
            Object.freeze(this);
        }
        equals(other) {
            return (this.x === other.x) && (this.y === other.y);
        }
        round() {
            return new Coord({
                x: Math.round(this.x),
                y: Math.round(this.y),
            });
        }
        oneNorm(other) {
            return this.sub(other).originOneNorm();
        }
        originOneNorm() {
            return Math.abs(this.x) + Math.abs(this.y);
        }
        infNorm(other) {
            return this.sub(other).originInfNorm();
        }
        originInfNorm() {
            return Math.max(Math.abs(this.x), Math.abs(this.y));
        }
        axialAlignment(other) {
            return this.sub(other).originAxialAlignment();
        }
        originAxialAlignment() {
            return Math.abs(Math.abs(this.x) - Math.abs(this.y))
                / (Math.abs(this.x) + Math.abs(this.y));
        }
        add(other) {
            return new Coord({
                x: this.x + other.x,
                y: this.y + other.y,
            });
        }
        sub(other) {
            return new Coord({
                x: this.x - other.x,
                y: this.y - other.y,
            });
        }
        mul(scalar) {
            return new Coord({
                x: scalar * this.x,
                y: scalar * this.y,
            });
        }
    }
    Euclid2.Coord = Coord;
    Object.freeze(Coord);
    Object.freeze(Coord.prototype);
    class Grid extends _Grid__WEBPACK_IMPORTED_MODULE_1__["Grid"] {
        constructor(desc) {
            super(desc);
            const grid = [];
            for (let row = 0; row < this.dimensions.height; row++) {
                const newRow = [];
                for (let col = 0; col < this.dimensions.width; col++) {
                    const newTile = new desc.tileClass(new Coord({ x: col, y: row, }));
                    newRow.push(newTile);
                }
                grid.push(newRow);
            }
            this.grid = grid;
        }
        static getAmbiguityThreshold() {
            return 24;
        }
        static getSizeLimits() { return this.SIZE_LIMITS; }
        forEachTile(consumer, thisArg = this) {
            this.grid.forEach((row) => row.forEach((tile) => {
                consumer(tile);
            }, thisArg), thisArg);
        }
        getUntToward(sourceCoord, intendedDest) {
            const options = this.tile.destsFrom(sourceCoord).unoccupied.get;
            if (!(options.some((tile) => tile.coord.equals(sourceCoord)))) {
                throw new Error("Caller code didn't break the upward occupancy link.");
            }
            if (options.length === 1) {
                return options[0];
            }
            options.sort((tileA, TileB) => {
                return tileA.coord.oneNorm(intendedDest) - TileB.coord.oneNorm(intendedDest);
            }).sort((tileA, TileB) => {
                return tileA.coord.infNorm(intendedDest) - TileB.coord.infNorm(intendedDest);
            });
            for (let i = 1; i < options.length; i++) {
                if (options[i].coord.infNorm(intendedDest) > options[0].coord.infNorm(intendedDest)) {
                    options.splice(i);
                    break;
                }
            }
            if (options.length === 1) {
                return options[0];
            }
            if (options[0].coord.x - sourceCoord.x === 0 || options[0].coord.y - sourceCoord.y === 0) {
                if (sourceCoord.axialAlignment(sourceCoord.sub(intendedDest)) - 0.5 > 0.0) {
                    return options[0];
                }
                else {
                    options.shift();
                }
            }
            return options[Math.floor(options.length * Math.random())];
        }
        __getTileAt(coord) {
            if (coord.x < 0 || coord.x >= this.dimensions.width ||
                coord.y < 0 || coord.y >= this.dimensions.height) {
                throw new RangeError("Out of bounds. No such tile exists.");
            }
            return this.grid[coord.y][coord.x];
        }
        __getTileDestsFrom(coord, radius = 1) {
            let t = coord.y - radius;
            let b = coord.y + radius + 1;
            let l = coord.x - radius;
            let r = coord.x + radius + 1;
            if (t >= this.dimensions.height || b < 0
                || l >= this.dimensions.width || r < 0)
                return [];
            return this.grid.slice(Math.max(0, t), Math.min(this.dimensions.height, b)).flatMap((gridRow) => gridRow.slice(Math.max(0, l), Math.min(this.dimensions.width, r)));
        }
        __getTileSourcesTo(coord, radius = 1) {
            return this.__getTileDestsFrom(coord, radius);
        }
        static getSpawnCoords(playerCounts, dimensions) {
            return [{ x: 0, y: 0, },];
        }
        static getArea(dim) {
            return dim.height * dim.width;
        }
        static getRandomCoord(dimensions) {
            return new Coord(undefined);
        }
    }
    Grid.SIZE_LIMITS = Object.freeze({
        height: Object.freeze({ min: 10, max: 50, }),
        width: Object.freeze({ min: 10, max: 50, }),
    });
    Euclid2.Grid = Grid;
    (function (Grid) {
        class Visible extends Grid {
            constructor(desc) {
                super(desc);
                const gridElem = document.createElement("div");
                gridElem.style.setProperty("--euclid2-grid-width", this.dimensions.width.toString());
                for (const row of this.grid) {
                    for (const tile of row) {
                        gridElem.appendChild(tile.tileElem);
                    }
                }
                this.__VisibleGrid_super(desc, gridElem);
            }
        }
        Grid.Visible = Visible;
    })(Grid = Euclid2.Grid || (Euclid2.Grid = {}));
    Object.freeze(Grid);
    Object.freeze(Grid.prototype);
})(Euclid2 || (Euclid2 = {}));
Object.freeze(Euclid2);


/***/ }),

/***/ "./src/base/game/PostInit.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PostInit", function() { return PostInit; });
/* harmony import */ var floor_Coord__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/base/floor/Coord.ts");
/* harmony import */ var floor_Grid__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/base/floor/Grid.ts");
/* harmony import */ var floor_VisibleGrid__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("./src/base/floor/VisibleGrid.ts");
/* harmony import */ var floor_impl_Euclid2__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("./src/base/floor/impl/Euclid2.ts");
/* harmony import */ var floor_impl_Beehive__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("./src/base/floor/impl/Beehive.ts");
/* harmony import */ var game_player_ArtificialPlayer__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("./src/base/game/player/ArtificialPlayer.ts");
/* harmony import */ var game_player_artificials_Chaser__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("./src/base/game/player/artificials/Chaser.ts");







function PostInit() {
    floor_Grid__WEBPACK_IMPORTED_MODULE_1__["Grid"].__Constructors
        = Object.freeze({
            [floor_Coord__WEBPACK_IMPORTED_MODULE_0__["Coord"].System.EUCLID2]: floor_impl_Euclid2__WEBPACK_IMPORTED_MODULE_3__["Euclid2"].Grid,
            [floor_Coord__WEBPACK_IMPORTED_MODULE_0__["Coord"].System.BEEHIVE]: floor_impl_Beehive__WEBPACK_IMPORTED_MODULE_4__["Beehive"].Grid,
        });
    Object.freeze(floor_Grid__WEBPACK_IMPORTED_MODULE_1__["Grid"]);
    Object.freeze(floor_Grid__WEBPACK_IMPORTED_MODULE_1__["Grid"].prototype);
    floor_VisibleGrid__WEBPACK_IMPORTED_MODULE_2__["VisibleGrid"].__Constructors
        = Object.freeze({
            [floor_Coord__WEBPACK_IMPORTED_MODULE_0__["Coord"].System.EUCLID2]: floor_impl_Euclid2__WEBPACK_IMPORTED_MODULE_3__["Euclid2"].Grid.Visible,
            [floor_Coord__WEBPACK_IMPORTED_MODULE_0__["Coord"].System.BEEHIVE]: floor_impl_Beehive__WEBPACK_IMPORTED_MODULE_4__["Beehive"].Grid.Visible,
        });
    Object.freeze(floor_VisibleGrid__WEBPACK_IMPORTED_MODULE_2__["VisibleGrid"]);
    game_player_ArtificialPlayer__WEBPACK_IMPORTED_MODULE_5__["ArtificialPlayer"].__Constructors
        = Object.freeze({
            CHASER: game_player_artificials_Chaser__WEBPACK_IMPORTED_MODULE_6__["Chaser"],
        });
    Object.freeze(game_player_ArtificialPlayer__WEBPACK_IMPORTED_MODULE_5__["ArtificialPlayer"]);
    Object.freeze(game_player_ArtificialPlayer__WEBPACK_IMPORTED_MODULE_5__["ArtificialPlayer"].prototype);
}
Object.freeze(PostInit);


/***/ }),

/***/ "./src/base/game/__gameparts/Manager.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GameManager", function() { return GameManager; });
/* harmony import */ var lang_Lang__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/base/lang/Lang.ts");
/* harmony import */ var game_Game__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/base/game/Game.ts");
/* harmony import */ var lang_impl_English__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("./src/base/lang/impl/English.ts");
/* harmony import */ var game_gameparts_Events__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("./src/base/game/__gameparts/Events.ts");




class GameManager extends game_gameparts_Events__WEBPACK_IMPORTED_MODULE_3__["GameEvents"] {
    constructor(gameType, impl, desc) {
        super(gameType, impl, desc);
        this.averageFreeHealth = desc.averageFreeHealthPerTile * this.grid.area;
        this.lang = lang_impl_English__WEBPACK_IMPORTED_MODULE_2__["English"].Lowercase.getInstance();
        const minLangLeaves = this.grid.static.getAmbiguityThreshold();
        if (this.lang.numLeaves < minLangLeaves) {
            throw new Error(`Found ${this.lang.numLeaves} leaves, but at`
                + ` least ${minLangLeaves} were required. The provided mappings`
                + ` composing the current Lang-under-construction are not`
                + ` sufficient to ensure that a shuffling operation will always`
                + ` be able to find a safe candidate to use as a replacement.`
                + ` Please see the spec for Lang.getNonConflictingChar.`);
        }
        this.langBalancingScheme = desc.langBalancingScheme;
    }
    reset() {
        super.reset();
        this.currentFreeHealth = 0.0;
        this.lang.reset();
        this.grid.forEachTile((tile) => {
            tile.setLangCharSeqPair(this.dryRunShuffleLangCharSeqAt(tile));
        });
        this.teams.forEach((team) => team.reset());
        const spawnPoints = this.grid.static.getSpawnCoords(this.players.length, this.grid.dimensions);
        this.players.forEach((player) => {
            player.reset(this.grid.tile.at(spawnPoints[player.playerId]));
        });
    }
    dryRunShuffleLangCharSeqAt(targetTile) {
        targetTile.setLangCharSeqPair(lang_Lang__WEBPACK_IMPORTED_MODULE_0__["Lang"].CharSeqPair.NULL);
        const avoid = Array.from(new Set(this.grid.tile.sourcesTo(targetTile.coord).get
            .flatMap((sourceToTarget) => this.grid.tile.destsFrom(sourceToTarget.coord).get)));
        return this.lang.getNonConflictingChar(avoid
            .map((tile) => tile.langSeq)
            .filter((seq) => seq), this.langBalancingScheme);
    }
    dryRunSpawnFreeHealth() {
        return [];
    }
    managerCheckGamePlayingRequest(desc) {
        if (this.status !== game_Game__WEBPACK_IMPORTED_MODULE_1__["Game"].Status.PLAYING) {
            return undefined;
        }
        const player = this.players[desc.playerId];
        if (!player) {
            throw new Error("No such player exists.");
        }
        if (desc.playerLastAcceptedRequestId !== player.lastAcceptedRequestId) {
            throw new RangeError((desc.playerLastAcceptedRequestId < player.lastAcceptedRequestId)
                ? ("Clients should not make requests until they have"
                    + " received my response to their last request.")
                : ("Client seems to have incremented the request ID"
                    + " counter on their own, which is is illegal."));
        }
        return player;
    }
    processMoveRequest(desc) {
        const player = this.managerCheckGamePlayingRequest(desc);
        if (!player) {
            this.processMoveExecute(desc);
            return;
        }
        const dest = this.grid.tile.at(desc.dest.coord);
        if (dest.isOccupied ||
            dest.lastKnownUpdateId !== desc.dest.lastKnownUpdateId) {
            this.processMoveExecute(desc);
            return;
        }
        desc.playerLastAcceptedRequestId = (1 + player.lastAcceptedRequestId);
        desc.newPlayerHealth = {
            score: player.status.score + dest.freeHealth,
            health: player.status.health + dest.freeHealth,
        };
        desc.dest.lastKnownUpdateId = (1 + dest.lastKnownUpdateId);
        this.currentFreeHealth -= dest.freeHealth;
        desc.dest.newFreeHealth = 0;
        desc.dest.newCharSeqPair = this.dryRunShuffleLangCharSeqAt(dest);
        desc.tilesWithHealthUpdates = this.dryRunSpawnFreeHealth();
        desc.eventId = this.getNextUnusedEventId();
        this.processMoveExecute(desc);
    }
    processBubbleRequest(desc) {
        const bubbler = this.managerCheckGamePlayingRequest(desc);
        if (!bubbler) {
            this.processBubbleExecute(desc);
            return;
        }
        desc.playerLastAcceptedRequestId = (1 + bubbler.lastAcceptedRequestId);
        desc.eventId = this.getNextUnusedEventId();
        this.processBubbleExecute(desc);
    }
}
Object.freeze(GameManager);
Object.freeze(GameManager.prototype);


/***/ }),

/***/ "./src/base/game/player/ArtificialPlayer.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ArtificialPlayer", function() { return ArtificialPlayer; });
/* harmony import */ var game_Game__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/base/game/Game.ts");
/* harmony import */ var _Player__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/base/game/player/Player.ts");


class ArtificialPlayer extends _Player__WEBPACK_IMPORTED_MODULE_1__["Player"] {
    constructor(game, desc) {
        super(game, desc);
        if (game.gameType === game_Game__WEBPACK_IMPORTED_MODULE_0__["Game"].Type.CLIENT) {
            throw new TypeError("ClientGames should be using regular Players instead.");
        }
    }
    __abstractNotifyThatGameStatusBecamePlaying() {
        this.movementContinueWithInitialDelay();
    }
    __abstractNotifyThatGameStatusBecamePaused() {
        this.game.cancelTimeout(this.scheduledMovementCallbackId);
        this.scheduledMovementCallbackId = undefined;
    }
    __abstractNotifyThatGameStatusBecameOver() {
        this.game.cancelTimeout(this.scheduledMovementCallbackId);
        this.scheduledMovementCallbackId = undefined;
    }
    movementContinue() {
        this.makeMovementRequest(this.game.grid.getUntToward(this.coord, this.computeDesiredDestination()));
        this.movementContinueWithInitialDelay();
    }
    movementContinueWithInitialDelay() {
        this.scheduledMovementCallbackId = this.game.setTimeout(this.movementContinue, this.computeNextMovementTimer());
        return;
    }
}
(function (ArtificialPlayer) {
    ArtificialPlayer.of = (game, playerDesc) => {
        return new (ArtificialPlayer.__Constructors[playerDesc.familyId])(game, playerDesc);
    };
})(ArtificialPlayer || (ArtificialPlayer = {}));


/***/ }),

/***/ "./src/base/game/player/artificials/Chaser.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Chaser", function() { return Chaser; });
/* harmony import */ var _ArtificialPlayer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/base/game/player/ArtificialPlayer.ts");

class Chaser extends _ArtificialPlayer__WEBPACK_IMPORTED_MODULE_0__["ArtificialPlayer"] {
    constructor(game, desc) {
        super(game, desc);
    }
    computeDesiredDestination() {
        return undefined;
    }
    computeNextMovementTimer() {
        return undefined;
    }
}
Object.freeze(Chaser);
Object.freeze(Chaser.prototype);


/***/ }),

/***/ "./src/base/lang/impl/English.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "English", function() { return English; });
/* harmony import */ var lang_Lang__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/base/lang/Lang.ts");

var English;
(function (English) {
    class Lowercase extends lang_Lang__WEBPACK_IMPORTED_MODULE_0__["Lang"] {
        constructor() {
            super(Lowercase, Object.entries(LETTER_FREQUENCY).reduce((accumulator, current) => {
                const char = current[0];
                const seq = current[0];
                const weight = current[1];
                accumulator[char] = { seq, weight, };
                return accumulator;
            }, {}));
        }
        static getName() {
            return lang_Lang__WEBPACK_IMPORTED_MODULE_0__["Lang"].Names.ENGLISH__LOWERCASE;
        }
        static getBlurb() {
            return "";
        }
        static getInstance() {
            if (!this.SINGLETON) {
                this.SINGLETON = new Lowercase();
            }
            return this.SINGLETON;
        }
    }
    Lowercase.SINGLETON = undefined;
    English.Lowercase = Lowercase;
    Lowercase;
    Object.seal(Lowercase);
    Object.freeze(Lowercase.prototype);
    class MixedCase extends lang_Lang__WEBPACK_IMPORTED_MODULE_0__["Lang"] {
        constructor() {
            let initializer = {};
            const addMappings = (charSeqTransform) => {
                initializer = Object.entries(LETTER_FREQUENCY).reduce((accumulator, current) => {
                    const char = charSeqTransform(current[0]);
                    const seq = charSeqTransform(current[0]);
                    const weight = current[1];
                    accumulator[char] = { seq, weight, };
                    return accumulator;
                }, initializer);
            };
            addMappings((cs) => cs.toLowerCase());
            addMappings((cs) => cs.toUpperCase());
            super(MixedCase, initializer);
        }
        static getName() {
            return lang_Lang__WEBPACK_IMPORTED_MODULE_0__["Lang"].Names.ENGLISH__MIXEDCASE;
        }
        static getBlurb() {
            return "";
        }
        static getInstance() {
            if (!this.SINGLETON) {
                this.SINGLETON = new MixedCase();
            }
            return this.SINGLETON;
        }
    }
    MixedCase.SINGLETON = undefined;
    English.MixedCase = MixedCase;
    MixedCase;
    Object.seal(MixedCase);
    Object.freeze(MixedCase.prototype);
    const LETTER_FREQUENCY = Object.freeze({
        a: 8.167, b: 1.492, c: 2.202, d: 4.253,
        e: 12.702, f: 2.228, g: 2.015, h: 6.094,
        i: 6.966, j: 0.153, k: 1.292, l: 4.025,
        m: 2.406, n: 6.749, o: 7.507, p: 1.929,
        q: 0.095, r: 5.987, s: 6.327, t: 9.356,
        u: 2.758, v: 0.978, w: 2.560, x: 0.150,
        y: 1.994, z: 0.077,
    });
})(English || (English = {}));
Object.seal(English);


/***/ }),

/***/ "./src/offline/OfflineGame.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OfflineGame", function() { return OfflineGame; });
/* harmony import */ var game_Game__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/base/game/Game.ts");
/* harmony import */ var _browser_GameSettings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/browser/GameSettings.ts");
/* harmony import */ var floor_VisibleTile__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("./src/base/floor/VisibleTile.ts");
/* harmony import */ var floor_VisibleGrid__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("./src/base/floor/VisibleGrid.ts");
/* harmony import */ var game_player_OperatorPlayer__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("./src/base/game/player/OperatorPlayer.ts");
/* harmony import */ var game_player_VisiblePlayerStatus__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("./src/base/game/player/VisiblePlayerStatus.ts");
/* harmony import */ var game_player_ArtificialPlayer__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("./src/base/game/player/ArtificialPlayer.ts");
/* harmony import */ var game_gameparts_Manager__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__("./src/base/game/__gameparts/Manager.ts");








class OfflineGame extends game_gameparts_Manager__WEBPACK_IMPORTED_MODULE_7__["GameManager"] {
    constructor(gameDesc) {
        super(game_Game__WEBPACK_IMPORTED_MODULE_0__["Game"].Type.OFFLINE, {
            tileClass: floor_VisibleTile__WEBPACK_IMPORTED_MODULE_2__["VisibleTile"],
            playerStatusCtor: game_player_VisiblePlayerStatus__WEBPACK_IMPORTED_MODULE_5__["VisiblePlayerStatus"],
        }, gameDesc);
        if (!this.operator) {
            throw new Error("The Operator for an OfflineGame should be defined.");
        }
        game_player_VisiblePlayerStatus__WEBPACK_IMPORTED_MODULE_5__["VisiblePlayerStatus"].colourizeTeamMembers(this.teams, this.operator);
        this.settings = _browser_GameSettings__WEBPACK_IMPORTED_MODULE_1__["LocalGameSettings"].getInstance();
        this.reset();
        this.grid.hostElem.addEventListener("keydown", (ev) => {
            this.operator.processKeyboardInput(ev);
            if (ev.keyCode === 32) {
                ev.preventDefault();
                return false;
            }
            return true;
        });
    }
    __getGridImplementation(coordSys) {
        return floor_VisibleGrid__WEBPACK_IMPORTED_MODULE_3__["VisibleGrid"].getImplementation(coordSys);
    }
    __createOperatorPlayer(desc) {
        return new game_player_OperatorPlayer__WEBPACK_IMPORTED_MODULE_4__["OperatorPlayer"](this, desc);
    }
    __createArtifPlayer(desc) {
        return game_player_ArtificialPlayer__WEBPACK_IMPORTED_MODULE_6__["ArtificialPlayer"].of(this, desc);
    }
    setTimeout(callback, millis, ...args) {
        return setTimeout(callback, millis, args);
    }
    cancelTimeout(handle) {
        clearTimeout(handle);
    }
}
Object.freeze(OfflineGame);
Object.freeze(OfflineGame.prototype);


/***/ }),

/***/ "./src/offline/index.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "game", function() { return game; });
/* harmony import */ var _browser_WebHooks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/browser/WebHooks.ts");
/* harmony import */ var floor_Tile__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/base/floor/Tile.ts");
/* harmony import */ var lang_LangSeqTreeNode__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("./src/base/lang/LangSeqTreeNode.ts");
/* harmony import */ var _OfflineGame__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("./src/offline/OfflineGame.ts");
/* harmony import */ var game_PostInit__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("./src/base/game/PostInit.ts");





Object(game_PostInit__WEBPACK_IMPORTED_MODULE_4__["PostInit"])();
const game = new _OfflineGame__WEBPACK_IMPORTED_MODULE_3__["OfflineGame"]({
    coordSys: floor_Tile__WEBPACK_IMPORTED_MODULE_1__["Coord"].System.EUCLID2,
    gridDimensions: {
        height: 21,
        width: 21,
    },
    gridHtmlIdHook: _browser_WebHooks__WEBPACK_IMPORTED_MODULE_0__["WebHooks"].Grid.Id.GRID,
    averageFreeHealthPerTile: 1.0 / 70.0,
    langBalancingScheme: lang_LangSeqTreeNode__WEBPACK_IMPORTED_MODULE_2__["BalancingScheme"].WEIGHT,
    languageName: "engl-low",
    operatorIndex: 0,
    playerDescs: [
        {
            familyId: "HUMAN",
            teamId: 0,
            username: "hello world",
            socketId: "todo",
            noCheckGameOver: false,
        },
    ],
});
game.reset();
console.log(game);
console.log(game.lang.simpleView());
game.statusBecomePlaying();


/***/ })

/******/ });
//# sourceMappingURL=index.js.map