(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["client~offline"],{

/***/ "./src/base/floor/Coord.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Coord", function() { return Coord; });
var Coord;
(function (Coord) {
    let System;
    (function (System) {
        System["EUCLID2"] = "EUCLID2";
        System["BEEHIVE"] = "BEEHIVE";
    })(System = Coord.System || (Coord.System = {}));
    class Abstract {
        constructor(desc) {
            desc;
        }
    }
    Coord.Abstract = Abstract;
    (function (Abstract) {
        class Mathy extends Coord.Abstract {
        }
        Abstract.Mathy = Mathy;
    })(Abstract = Coord.Abstract || (Coord.Abstract = {}));
    Object.freeze(Abstract);
    Object.freeze(Abstract.prototype);
})(Coord || (Coord = {}));
Object.freeze(Coord);


/***/ }),

/***/ "./src/base/floor/Tile.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Tile", function() { return Tile; });
/* harmony import */ var utils_TypeDefs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/base/utils/TypeDefs.ts");
/* harmony import */ var _Coord__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/base/floor/Coord.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Coord", function() { return _Coord__WEBPACK_IMPORTED_MODULE_1__["Coord"]; });

var __classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _occupantId, _freeHealth, _langChar, _langSeq;



class Tile {
    constructor(coord) {
        _occupantId.set(this, void 0);
        _freeHealth.set(this, void 0);
        _langChar.set(this, void 0);
        _langSeq.set(this, void 0);
        this.coord = coord;
        __classPrivateFieldSet(this, _occupantId, utils_TypeDefs__WEBPACK_IMPORTED_MODULE_0__["Player"].Id.NULL);
    }
    reset() {
        this.evictOccupant();
        this.lastKnownUpdateId = 0;
        this.freeHealth = 0;
        this.setLangCharSeqPair(utils_TypeDefs__WEBPACK_IMPORTED_MODULE_0__["Lang"].CharSeqPair.NULL);
    }
    visualBell() {
    }
    setOccupant(playerId) {
        __classPrivateFieldSet(this, _occupantId, playerId);
    }
    get isOccupied() {
        return this.occupantId !== utils_TypeDefs__WEBPACK_IMPORTED_MODULE_0__["Player"].Id.NULL;
    }
    evictOccupant() {
        __classPrivateFieldSet(this, _occupantId, utils_TypeDefs__WEBPACK_IMPORTED_MODULE_0__["Player"].Id.NULL);
    }
    get occupantId() {
        return __classPrivateFieldGet(this, _occupantId);
    }
    get freeHealth() {
        return __classPrivateFieldGet(this, _freeHealth);
    }
    set freeHealth(score) {
        __classPrivateFieldSet(this, _freeHealth, score);
    }
    setLangCharSeqPair(charSeqPair) {
        __classPrivateFieldSet(this, _langChar, charSeqPair.char);
        __classPrivateFieldSet(this, _langSeq, charSeqPair.seq);
    }
    get langChar() {
        return __classPrivateFieldGet(this, _langChar);
    }
    get langSeq() {
        return __classPrivateFieldGet(this, _langSeq);
    }
}
_occupantId = new WeakMap(), _freeHealth = new WeakMap(), _langChar = new WeakMap(), _langSeq = new WeakMap();
Tile;
Object.freeze(Tile);
Object.freeze(Tile.prototype);


/***/ }),

/***/ "./src/base/floor/TileGetter.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TileGetter", function() { return TileGetter; });
class TileGetter {
    constructor(source) {
        this.source = source;
    }
    at(...args) {
        return this.source.__getTileAt(...args);
    }
    destsFrom(...args) {
        return new Query(this.source.__getTileDestsFrom(...args));
    }
    sourcesTo(...args) {
        return new Query(this.source.__getTileSourcesTo(...args));
    }
}
Object.freeze(TileGetter);
Object.freeze(TileGetter.prototype);
class Query {
    constructor(contents) {
        this.contents = contents;
    }
    get occupied() {
        this.contents = this.contents.filter((tile) => tile.isOccupied);
        return this;
    }
    get unoccupied() {
        this.contents = this.contents.filter((tile) => !tile.isOccupied);
        return this;
    }
    get get() {
        const retval = this.contents;
        return retval;
    }
}
Object.freeze(Query);
Object.freeze(Query.prototype);


/***/ }),

/***/ "./src/base/floor/VisibleGrid.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "VisibleGrid", function() { return VisibleGrid; });
var VisibleGrid;
(function (VisibleGrid) {
    ;
    VisibleGrid.getImplementation = (coordSys) => {
        const ctor = VisibleGrid.__Constructors[coordSys];
        return ctor;
    };
})(VisibleGrid || (VisibleGrid = {}));


/***/ }),

/***/ "./src/base/floor/VisibleTile.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "VisibleTile", function() { return VisibleTile; });
/* harmony import */ var _webui_WebHooks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/webui/WebHooks.ts");
/* harmony import */ var _Tile__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/base/floor/Tile.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Coord", function() { return _Tile__WEBPACK_IMPORTED_MODULE_1__["Coord"]; });




class VisibleTile extends _Tile__WEBPACK_IMPORTED_MODULE_1__["Tile"] {
    constructor(coordDesc) {
        super(coordDesc);
        {
            const tCell = document.createElement("td");
            tCell.className = _webui_WebHooks__WEBPACK_IMPORTED_MODULE_0__["WebHooks"].Tile.Class.BASE;
            {
                const cDiv = document.createElement("div");
                cDiv.className = _webui_WebHooks__WEBPACK_IMPORTED_MODULE_0__["WebHooks"].Tile.Class.LANG_CHAR;
                cDiv.classList.add(_webui_WebHooks__WEBPACK_IMPORTED_MODULE_0__["WebHooks"].General.Class.FILL_PARENT);
                tCell.appendChild(cDiv);
                this.langCharElem = cDiv;
            }
            {
                const sDiv = document.createElement("div");
                sDiv.className = _webui_WebHooks__WEBPACK_IMPORTED_MODULE_0__["WebHooks"].Tile.Class.LANG_SEQ;
                tCell.appendChild(sDiv);
                this.langSeqElem = sDiv;
            }
            this.tileElem = tCell;
        }
    }
    visualBell() {
        this.tileElem;
    }
    evictOccupant() {
        super.evictOccupant();
    }
    set freeHealth(newHealth) {
        super.freeHealth = newHealth;
        if (this.freeHealth) {
            this.tileElem.dataset[_webui_WebHooks__WEBPACK_IMPORTED_MODULE_0__["WebHooks"].Tile.Dataset.HEALTH] = newHealth.toString();
        }
        else {
            delete this.tileElem.dataset[_webui_WebHooks__WEBPACK_IMPORTED_MODULE_0__["WebHooks"].Tile.Dataset.HEALTH];
        }
    }
    setLangCharSeqPair(charSeqPair) {
        super.setLangCharSeqPair(charSeqPair);
        this.langCharElem.innerText = this.langChar;
        this.langSeqElem.innerText = this.langSeq;
    }
}
VisibleTile;
Object.freeze(VisibleTile);
Object.freeze(VisibleTile.prototype);


/***/ }),

/***/ "./src/base/game/Game.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Game", function() { return Game; });
var Game;
(function (Game) {
    let Type;
    (function (Type) {
        Type["OFFLINE"] = "OFFLINE";
        Type["SERVER"] = "SERVER";
        Type["CLIENT"] = "CLIENT";
    })(Type = Game.Type || (Game.Type = {}));
    let CtorArgs;
    (function (CtorArgs) {
        CtorArgs.EVENT_NAME = "game-create";
    })(CtorArgs = Game.CtorArgs || (Game.CtorArgs = {}));
    let Status;
    (function (Status) {
        Status["PLAYING"] = "PLAYING";
        Status["PAUSED"] = "PAUSED";
        Status["OVER"] = "OVER";
    })(Status = Game.Status || (Game.Status = {}));
})(Game || (Game = {}));
Object.freeze(Game);


/***/ }),

/***/ "./src/base/game/__gameparts/Base.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GameBase", function() { return GameBase; });
/* harmony import */ var _Game__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/base/game/Game.ts");
/* harmony import */ var _player_Player__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/base/game/player/Player.ts");
var __classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _status;


class GameBase {
    constructor(gameType, impl, desc) {
        _status.set(this, void 0);
        this.gameType = gameType;
        const gridClass = this.__getGridImplementation(desc.coordSys);
        this.grid = new (gridClass)({
            gridClass: gridClass,
            tileClass: impl.tileClass,
            coordSys: desc.coordSys,
            dimensions: desc.gridDimensions,
            domGridHtmlIdHook: (desc.gridHtmlIdHook || "n/a"),
        });
        this.__playerStatusCtor = impl.playerStatusCtor;
        this.players = this.createPlayers(desc);
        if (desc.operatorIndex !== undefined) {
            this.operator = this.players[desc.operatorIndex];
        }
        const teams = [];
        this.players.forEach((player) => {
            if (!teams[player.teamId]) {
                teams[player.teamId] = [];
            }
            teams[player.teamId].push(player);
        });
        this.teams = teams.map((teammateArray, teamId) => {
            return new _player_Player__WEBPACK_IMPORTED_MODULE_1__["Team"](teamId, teammateArray);
        });
        if (this.teams.every((team) => team.id === _player_Player__WEBPACK_IMPORTED_MODULE_1__["Team"].ElimOrder.IMMORTAL)) {
            throw new Error("All teams are immortal. The game will never end.");
        }
    }
    reset() {
        this.grid.reset();
        __classPrivateFieldSet(this, _status, _Game__WEBPACK_IMPORTED_MODULE_0__["Game"].Status.PAUSED);
    }
    createPlayers(gameDesc) {
        const playerDescs = (this.gameType === _Game__WEBPACK_IMPORTED_MODULE_0__["Game"].Type.CLIENT)
            ? gameDesc.playerDescs
            : _player_Player__WEBPACK_IMPORTED_MODULE_1__["Player"].CtorArgs.finalize(gameDesc.playerDescs, gameDesc.languageName);
        return playerDescs.map((playerDesc, playerIndex) => {
            if (playerDesc.familyId === _player_Player__WEBPACK_IMPORTED_MODULE_1__["Player"].Family.HUMAN) {
                return (playerIndex === gameDesc.operatorIndex)
                    ? this.__createOperatorPlayer(playerDesc)
                    : new _player_Player__WEBPACK_IMPORTED_MODULE_1__["Player"](this, playerDesc);
            }
            else {
                return this.__createArtifPlayer(playerDesc);
            }
        });
    }
    get status() {
        return __classPrivateFieldGet(this, _status);
    }
    statusBecomePlaying() {
        if (this.status !== _Game__WEBPACK_IMPORTED_MODULE_0__["Game"].Status.PAUSED) {
            throw new Error("Can only resume a game that is currently paused.");
        }
        this.players.forEach((player) => {
            player.__abstractNotifyThatGameStatusBecamePlaying();
        });
        this.__abstractStatusBecomePlaying();
        __classPrivateFieldSet(this, _status, _Game__WEBPACK_IMPORTED_MODULE_0__["Game"].Status.PLAYING);
        if (this.grid.hostElem) {
            this.grid.hostElem.focus();
        }
    }
    statusBecomePaused() {
        if (this.status !== _Game__WEBPACK_IMPORTED_MODULE_0__["Game"].Status.PLAYING) {
            throw new Error("Can only pause a game that is currently playing.");
        }
        this.players.forEach((player) => {
            player.__abstractNotifyThatGameStatusBecamePaused();
        });
        this.__abstractStatusBecomePaused();
        __classPrivateFieldSet(this, _status, _Game__WEBPACK_IMPORTED_MODULE_0__["Game"].Status.PAUSED);
    }
    statusBecomeOver() {
        if (this.status !== _Game__WEBPACK_IMPORTED_MODULE_0__["Game"].Status.PLAYING) {
            throw new Error("Can only end a game that is currently playing.");
        }
        this.players.forEach((player) => {
            player.__abstractNotifyThatGameStatusBecameOver();
        });
        this.__abstractStatusBecomeOver();
        __classPrivateFieldSet(this, _status, _Game__WEBPACK_IMPORTED_MODULE_0__["Game"].Status.OVER);
    }
    __abstractStatusBecomePlaying() { }
    __abstractStatusBecomePaused() { }
    __abstractStatusBecomeOver() { }
}
_status = new WeakMap();
Object.freeze(GameBase);
Object.freeze(GameBase.prototype);


/***/ }),

/***/ "./src/base/game/__gameparts/Events.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GameEvents", function() { return GameEvents; });
/* harmony import */ var _events_EventRecordEntry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/base/game/events/EventRecordEntry.ts");
/* harmony import */ var _Base__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/base/game/__gameparts/Base.ts");


class GameEvents extends _Base__WEBPACK_IMPORTED_MODULE_1__["GameBase"] {
    constructor(gameType, impl, gameDesc) {
        super(gameType, impl, gameDesc);
        this.eventRecord = [];
    }
    reset() {
        this.eventRecord.splice(0);
        super.reset();
    }
    getNextUnusedEventId() {
        return this.eventRecord.length;
    }
    recordEvent(desc) {
        const id = desc.eventId;
        if (id === _events_EventRecordEntry__WEBPACK_IMPORTED_MODULE_0__["EventRecordEntry"].EVENT_ID_REJECT) {
            throw new TypeError("Do not try to record events for rejected requests.");
        }
        else if (id < 0 || id !== Math.trunc(id)) {
            throw new RangeError("Event ID's must only be assigned positive, integer values.");
        }
        else if (this.eventRecord[id]) {
            throw new Error("Event ID's must be assigned unique values.");
        }
        this.eventRecord[id] = desc;
    }
    executeTileModificationsEvent(desc, doCheckOperatorSeqBuffer = true) {
        const dest = this.grid.tile.at(desc.coord);
        if (dest.lastKnownUpdateId < desc.lastKnownUpdateId) {
            if (desc.newCharSeqPair) {
                dest.setLangCharSeqPair(desc.newCharSeqPair);
                if (doCheckOperatorSeqBuffer && this.operator !== undefined
                    && !(this.operator.tile.destsFrom().get.includes(dest))) {
                    this.operator.seqBufferAcceptKey("");
                }
            }
            dest.lastKnownUpdateId = desc.lastKnownUpdateId;
            dest.freeHealth = desc.newFreeHealth;
        }
    }
    processMoveExecute(desc) {
        const player = this.players[desc.playerId];
        const dest = this.grid.tile.at(desc.dest.coord);
        const clientEventLag = desc.playerLastAcceptedRequestId - player.lastAcceptedRequestId;
        if (desc.eventId === _events_EventRecordEntry__WEBPACK_IMPORTED_MODULE_0__["EventRecordEntry"].EVENT_ID_REJECT) {
            if (clientEventLag === 1) {
                player.requestInFlight = false;
            }
            return;
        }
        this.recordEvent(desc);
        this.executeTileModificationsEvent(desc.dest, player !== this.operator);
        desc.tilesWithHealthUpdates.forEach((desc) => {
            this.executeTileModificationsEvent(desc);
        });
        if (clientEventLag > 1) {
            if (player === this.operator) {
                throw new Error("This never happens. See comment in source.");
            }
            return;
        }
        player.requestInFlight = false;
        if ((player === this.operator)
            ? (clientEventLag === 1)
            : (clientEventLag <= 1)) {
            player.status.score = desc.newPlayerHealth.score;
            player.status.health = desc.newPlayerHealth.health;
            player.moveTo(dest);
            player.lastAcceptedRequestId = desc.playerLastAcceptedRequestId;
        }
        else {
            throw new Error("This never happens. See comment in source");
        }
    }
    processBubbleExecute(desc) {
        const bubbler = this.players[desc.playerId];
        bubbler.requestInFlight = false;
        if (desc.eventId !== _events_EventRecordEntry__WEBPACK_IMPORTED_MODULE_0__["EventRecordEntry"].EVENT_ID_REJECT) {
            this.recordEvent(desc);
        }
    }
}
Object.freeze(GameEvents);
Object.freeze(GameEvents.prototype);


/***/ }),

/***/ "./src/base/game/events/EventRecordEntry.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EventRecordEntry", function() { return EventRecordEntry; });
var EventRecordEntry;
(function (EventRecordEntry) {
    EventRecordEntry.EVENT_ID_REJECT = -1;
})(EventRecordEntry || (EventRecordEntry = {}));
Object.freeze(EventRecordEntry);
;


/***/ }),

/***/ "./src/base/game/events/PlayerActionEvent.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PlayerActionEvent", function() { return PlayerActionEvent; });
/* harmony import */ var _EventRecordEntry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/base/game/events/EventRecordEntry.ts");

var PlayerActionEvent;
(function (PlayerActionEvent) {
    PlayerActionEvent.INITIAL_REQUEST_ID = -1;
    PlayerActionEvent.EVENT_NAME = Object.freeze({
        Bubble: "player-bubble",
        Movement: "player-movement",
    });
    class Bubble {
        constructor(playerId, lastAcceptedRequestId) {
            this.eventId = _EventRecordEntry__WEBPACK_IMPORTED_MODULE_0__["EventRecordEntry"].EVENT_ID_REJECT;
            this.affectedNeighbours = undefined;
            this.playerId = playerId;
            this.playerLastAcceptedRequestId = lastAcceptedRequestId;
        }
    }
    PlayerActionEvent.Bubble = Bubble;
    class Movement extends Bubble {
        constructor(playerId, lastAcceptedRequestId, destTile) {
            super(playerId, lastAcceptedRequestId);
            this.newPlayerHealth = undefined;
            this.tilesWithHealthUpdates = undefined;
            this.dest = {
                coord: destTile.coord,
                lastKnownUpdateId: destTile.lastKnownUpdateId,
                newCharSeqPair: undefined,
                newFreeHealth: undefined,
            };
        }
    }
    PlayerActionEvent.Movement = Movement;
})(PlayerActionEvent || (PlayerActionEvent = {}));
Object.freeze(PlayerActionEvent);


/***/ }),

/***/ "./src/base/game/player/OperatorPlayer.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OperatorPlayer", function() { return OperatorPlayer; });
/* harmony import */ var lang_Lang__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/base/lang/Lang.ts");
/* harmony import */ var game_Game__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/base/game/Game.ts");
/* harmony import */ var _Player__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("./src/base/game/player/Player.ts");
var __classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _seqBuffer;



class OperatorPlayer extends _Player__WEBPACK_IMPORTED_MODULE_2__["Player"] {
    constructor(game, desc) {
        super(game, desc);
        _seqBuffer.set(this, void 0);
        this.langRemappingFunc = lang_Lang__WEBPACK_IMPORTED_MODULE_0__["Lang"].RemappingFunctions[desc.langName];
    }
    reset(spawnTile) {
        super.reset(spawnTile);
        this.hostTile.tileElem.appendChild(this.status.playerDivElem);
        __classPrivateFieldSet(this, _seqBuffer, "");
    }
    processKeyboardInput(event) {
        if (false) {}
        else if (this.game.status === game_Game__WEBPACK_IMPORTED_MODULE_1__["Game"].Status.PLAYING) {
            if (!this.requestInFlight) {
                if (event.key.length !== 1)
                    return;
                this.seqBufferAcceptKey(event.key);
            }
        }
    }
    seqBufferAcceptKey(key) {
        const unts = this.tile.destsFrom().unoccupied.get;
        if (unts.length === 0) {
            return;
        }
        if (key) {
            key = this.langRemappingFunc(key);
            if (!(lang_Lang__WEBPACK_IMPORTED_MODULE_0__["Lang"].Seq.REGEXP.test(key))) {
                return;
            }
        }
        else {
            const possibleTarget = unts.find((tile) => tile.langSeq.startsWith(this.seqBuffer));
            if (!possibleTarget) {
                __classPrivateFieldSet(this, _seqBuffer, "");
            }
            return;
        }
        for (let newSeqBuffer = this.seqBuffer + key; newSeqBuffer.length; newSeqBuffer = newSeqBuffer.substring(1)) {
            const possibleTarget = unts.find((tile) => tile.langSeq.startsWith(newSeqBuffer));
            if (possibleTarget) {
                __classPrivateFieldSet(this, _seqBuffer, newSeqBuffer);
                if (possibleTarget.langSeq === newSeqBuffer) {
                    this.makeMovementRequest(possibleTarget);
                }
                return;
            }
        }
        __classPrivateFieldSet(this, _seqBuffer, "");
        this.hostTile.visualBell();
    }
    moveTo(dest) {
        __classPrivateFieldSet(this, _seqBuffer, "");
        super.moveTo(dest);
        this.hostTile.tileElem.appendChild(this.status.playerDivElem);
    }
    get seqBuffer() {
        return __classPrivateFieldGet(this, _seqBuffer);
    }
}
_seqBuffer = new WeakMap();
Object.freeze(OperatorPlayer);
Object.freeze(OperatorPlayer.prototype);


/***/ }),

/***/ "./src/base/game/player/Player.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Player", function() { return Player; });
/* harmony import */ var game_Game__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/base/game/Game.ts");
/* harmony import */ var game_events_PlayerActionEvent__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/base/game/events/PlayerActionEvent.ts");
/* harmony import */ var _PlayerSkeleton__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("./src/base/game/player/PlayerSkeleton.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "PlayerSkeleton", function() { return _PlayerSkeleton__WEBPACK_IMPORTED_MODULE_2__["PlayerSkeleton"]; });

/* harmony import */ var _PlayerStatus__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("./src/base/game/player/PlayerStatus.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "PlayerStatus", function() { return _PlayerStatus__WEBPACK_IMPORTED_MODULE_3__["PlayerStatus"]; });

/* harmony import */ var _Team__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("./src/base/game/player/Team.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Team", function() { return _Team__WEBPACK_IMPORTED_MODULE_4__["Team"]; });









class Player extends _PlayerSkeleton__WEBPACK_IMPORTED_MODULE_2__["PlayerSkeleton"] {
    constructor(game, desc) {
        super(game, desc.playerId);
        if (!(Player.Username.REGEXP.test(desc.username))) {
            throw new RangeError(`Username \"${desc.username}\"`
                + ` does not match the required regular expression,`
                + ` \"${Player.Username.REGEXP.source}\".`);
        }
        this.familyId = desc.familyId;
        this.teamId = desc.teamId;
        this.username = desc.username;
        this.status = new (this.game.__playerStatusCtor)(this, desc.noCheckGameOver);
    }
    reset(spawnTile) {
        super.reset(spawnTile);
        this.status.reset();
        this.lastAcceptedRequestId = game_events_PlayerActionEvent__WEBPACK_IMPORTED_MODULE_1__["PlayerActionEvent"].INITIAL_REQUEST_ID;
        this.requestInFlight = false;
    }
    __abstractNotifyThatGameStatusBecamePlaying() { }
    __abstractNotifyThatGameStatusBecamePaused() { }
    __abstractNotifyThatGameStatusBecameOver() { }
    makeMovementRequest(dest) {
        if (this.game.status !== game_Game__WEBPACK_IMPORTED_MODULE_0__["Game"].Status.PLAYING) {
            throw new Error("This is not a necessary precondition, but we're doing it anyway.");
        }
        else if (this.requestInFlight) {
            throw new Error("Only one request should ever be in flight at a time.");
        }
        this.requestInFlight = true;
        this.game.processMoveRequest(new game_events_PlayerActionEvent__WEBPACK_IMPORTED_MODULE_1__["PlayerActionEvent"].Movement(this.playerId, this.lastAcceptedRequestId, dest));
    }
    get team() {
        return this.game.teams[this.teamId];
    }
    isTeamedWith(other) {
        return this.team.members.includes(other);
    }
}
(function (Player) {
    let Username;
    (function (Username) {
        Username.REGEXP = /[a-zA-Z](?:[ ]?[a-zA-Z0-9:-]+?){4,}/;
    })(Username = Player.Username || (Player.Username = {}));
    let CtorArgs;
    (function (CtorArgs) {
        CtorArgs.finalize = (playerDescs, langName) => {
            const teamIdCleaner = Array.from(new Set(playerDescs.map((player) => player.teamId)))
                .sort((a, b) => a - b)
                .reduce((prev, originalId, squashedId) => {
                prev[originalId] = squashedId;
                return prev;
            }, []);
            return playerDescs
                .sort((pda, pdb) => teamIdCleaner[pda.teamId] - teamIdCleaner[pdb.teamId])
                .map((playerDesc, index) => {
                return {
                    playerId: index,
                    familyId: playerDesc.familyId,
                    teamId: teamIdCleaner[playerDesc.teamId],
                    socketId: playerDesc.socketId,
                    username: playerDesc.username,
                    langName: langName,
                    noCheckGameOver: playerDesc.noCheckGameOver,
                };
            });
        };
    })(CtorArgs = Player.CtorArgs || (Player.CtorArgs = {}));
    Object.freeze(CtorArgs);
})(Player || (Player = {}));
Object.freeze(Player);
Object.freeze(Player.prototype);


/***/ }),

/***/ "./src/base/game/player/PlayerSkeleton.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PlayerSkeleton", function() { return PlayerSkeleton; });
/* harmony import */ var utils_TypeDefs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/base/utils/TypeDefs.ts");
/* harmony import */ var game_Game__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/base/game/Game.ts");
/* harmony import */ var floor_TileGetter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("./src/base/floor/TileGetter.ts");
var __classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _hostTile;



class PlayerSkeleton extends utils_TypeDefs__WEBPACK_IMPORTED_MODULE_0__["Player"] {
    constructor(game, playerId) {
        super();
        _hostTile.set(this, void 0);
        if (Math.trunc(playerId) !== playerId) {
            throw new RangeError("Player ID's must be integer values.");
        }
        this.playerId = playerId;
        this.game = game;
        this.tile = new floor_TileGetter__WEBPACK_IMPORTED_MODULE_2__["TileGetter"](new PlayerSkeleton.TileGetterSource(this));
    }
    reset(spawnTile) {
        __classPrivateFieldSet(this, _hostTile, spawnTile);
        this.hostTile.setOccupant(this.playerId);
    }
    get coord() {
        return this.hostTile.coord;
    }
    get hostTile() {
        return __classPrivateFieldGet(this, _hostTile);
    }
    onGoBesideOtherPlayer() {
    }
    moveTo(dest) {
        if (this.hostTile.occupantId !== this.playerId) {
            if (this.game.gameType !== game_Game__WEBPACK_IMPORTED_MODULE_1__["Game"].Type.CLIENT) {
                throw new Error("Linkage between player and occupied tile disagrees.");
            }
        }
        else {
            this.hostTile.evictOccupant();
        }
        if (dest.isOccupied) {
            if (this.game.gameType !== game_Game__WEBPACK_IMPORTED_MODULE_1__["Game"].Type.CLIENT) {
                throw new Error("Only one player can occupy a tile at a time.");
            }
        }
        else {
            __classPrivateFieldSet(this, _hostTile, dest);
            dest.setOccupant(this.playerId);
        }
    }
}
_hostTile = new WeakMap();
(function (PlayerSkeleton) {
    class TileGetterSource {
        constructor(player) {
            this.player = player;
        }
        __getTileAt() {
            return this.player.game.grid.tile.at(this.player.coord);
        }
        __getTileDestsFrom() {
            return this.player.game.grid.tile.destsFrom(this.player.coord).get;
        }
        __getTileSourcesTo() {
            return this.player.game.grid.tile.sourcesTo(this.player.coord).get;
        }
    }
    PlayerSkeleton.TileGetterSource = TileGetterSource;
    Object.freeze(TileGetterSource);
    Object.freeze(TileGetterSource.prototype);
})(PlayerSkeleton || (PlayerSkeleton = {}));
Object.freeze(PlayerSkeleton);
Object.freeze(PlayerSkeleton.prototype);


/***/ }),

/***/ "./src/base/game/player/PlayerStatus.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PlayerStatus", function() { return PlayerStatus; });
/* harmony import */ var game_player_Team__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/base/game/player/Team.ts");
var __classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var _score, _health;

class PlayerStatus {
    constructor(player, noCheckGameOver) {
        _score.set(this, void 0);
        _health.set(this, void 0);
        this.player = player;
        this.noCheckGameOver = noCheckGameOver;
    }
    reset() {
        this.score = 0;
        this.health = 0;
    }
    get score() {
        return __classPrivateFieldGet(this, _score);
    }
    set score(newValue) {
        __classPrivateFieldSet(this, _score, newValue);
    }
    get health() {
        return __classPrivateFieldGet(this, _health);
    }
    set health(newHealth) {
        const oldIsDowned = this.isDowned;
        __classPrivateFieldSet(this, _health, newHealth);
        if (oldIsDowned)
            return;
        const team = this.player.team;
        const teams = this.player.game.teams;
        if (this.isDowned && !(this.noCheckGameOver) && team.elimOrder === 0) {
            if (team.members.every((player) => {
                return player.status.noCheckGameOver || player.status.isDowned;
            })) {
                const numNonStandingTeams = 1 + teams.filter((team) => {
                    return team.elimOrder !== game_player_Team__WEBPACK_IMPORTED_MODULE_0__["Team"].ElimOrder.STANDING;
                }).length;
                team.elimOrder
                    = 1 + teams.filter((team) => {
                        return team.elimOrder !== game_player_Team__WEBPACK_IMPORTED_MODULE_0__["Team"].ElimOrder.STANDING
                            && team.elimOrder !== game_player_Team__WEBPACK_IMPORTED_MODULE_0__["Team"].ElimOrder.IMMORTAL;
                    }).length;
                if (numNonStandingTeams === teams.length) {
                    this.player.game.statusBecomeOver();
                }
            }
        }
    }
    get isDowned() {
        return this.health < 0.0;
    }
}
_score = new WeakMap(), _health = new WeakMap();
Object.freeze(PlayerStatus);
Object.freeze(PlayerStatus.prototype);


/***/ }),

/***/ "./src/base/game/player/Team.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Team", function() { return Team; });
var __classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _elimOrder;
class Team {
    constructor(teamId, members) {
        _elimOrder.set(this, void 0);
        if (members.length === 0) {
            throw new Error("teams must have at least one member.");
        }
        this.id = teamId;
        this.members = members;
        __classPrivateFieldSet(this, _elimOrder, (this.members.every((member) => member.status.noCheckGameOver))
            ? Team.ElimOrder.IMMORTAL
            : Team.ElimOrder.STANDING);
    }
    reset() {
        if (this.elimOrder !== Team.ElimOrder.IMMORTAL) {
            this.elimOrder = Team.ElimOrder.STANDING;
        }
    }
    get elimOrder() {
        return __classPrivateFieldGet(this, _elimOrder);
    }
    set elimOrder(teamElimOrder) {
        if (this.elimOrder === Team.ElimOrder.IMMORTAL) {
            throw new Error("Cannot change the elimination status of an immortal team.");
        }
        __classPrivateFieldSet(this, _elimOrder, teamElimOrder);
    }
}
_elimOrder = new WeakMap();
(function (Team) {
    let ElimOrder;
    (function (ElimOrder) {
        ElimOrder.IMMORTAL = -1;
        ElimOrder.STANDING = 0;
    })(ElimOrder = Team.ElimOrder || (Team.ElimOrder = {}));
})(Team || (Team = {}));
Object.freeze(Team);
Object.freeze(Team.prototype);


/***/ }),

/***/ "./src/base/game/player/VisiblePlayerStatus.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "VisiblePlayerStatus", function() { return VisiblePlayerStatus; });
/* harmony import */ var _webui_WebHooks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/webui/WebHooks.ts");
/* harmony import */ var _OperatorPlayer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/base/game/player/OperatorPlayer.ts");
/* harmony import */ var _PlayerStatus__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("./src/base/game/player/PlayerStatus.ts");



class VisiblePlayerStatus extends _PlayerStatus__WEBPACK_IMPORTED_MODULE_2__["PlayerStatus"] {
    constructor(player, noCheckGameOver) {
        super(player, noCheckGameOver);
        {
            const pDiv = document.createElement("div");
            pDiv.classList.add(_webui_WebHooks__WEBPACK_IMPORTED_MODULE_0__["WebHooks"].Player.Class.BASE, _webui_WebHooks__WEBPACK_IMPORTED_MODULE_0__["WebHooks"].General.Class.FILL_PARENT);
            this.playerDivElem = pDiv;
        }
        {
            if (this.player instanceof _OperatorPlayer__WEBPACK_IMPORTED_MODULE_1__["OperatorPlayer"]) {
                const spotDiv = document.createElement("div");
                spotDiv.classList.add(_webui_WebHooks__WEBPACK_IMPORTED_MODULE_0__["WebHooks"].Grid.Class.SPOTLIGHT);
                this.playerDivElem.appendChild(spotDiv);
            }
        }
        {
            const doDiv = document.createElement("div");
            doDiv.classList.add(_webui_WebHooks__WEBPACK_IMPORTED_MODULE_0__["WebHooks"].Player.Class.DOWNED_OVERLAY, _webui_WebHooks__WEBPACK_IMPORTED_MODULE_0__["WebHooks"].General.Class.FILL_PARENT);
            this.playerDivElem.appendChild(doDiv);
        }
    }
    set score(newValue) {
        super.score = newValue;
    }
    set health(newHealth) {
        const oldIsDowned = this.isDowned;
        super.health = newHealth;
        if (oldIsDowned !== this.isDowned) {
            const dataDowned = _webui_WebHooks__WEBPACK_IMPORTED_MODULE_0__["WebHooks"].Player.Dataset.DOWNED;
            if (this.isDowned) {
                if (this.player.team.elimOrder) {
                    this.playerDivElem.dataset[dataDowned] = "team";
                }
                else {
                    this.playerDivElem.dataset[dataDowned] = "self";
                }
            }
            else {
                this.playerDivElem.dataset[dataDowned] = "no";
            }
        }
    }
}
(function (VisiblePlayerStatus) {
    function colourizeTeamMembers(teams, operator) {
        for (const team of teams) {
            for (const member of team.members) {
                member.status
                    .playerDivElem.dataset[_webui_WebHooks__WEBPACK_IMPORTED_MODULE_0__["WebHooks"].Player.Dataset.FACE_SWATCH]
                    = (member === operator) ? "me"
                        : (member.teamId === operator.teamId) ? "teammate" : "opponent";
            }
        }
    }
    VisiblePlayerStatus.colourizeTeamMembers = colourizeTeamMembers;
})(VisiblePlayerStatus || (VisiblePlayerStatus = {}));
Object.freeze(VisiblePlayerStatus);
Object.freeze(VisiblePlayerStatus.prototype);


/***/ }),

/***/ "./src/base/lang/Lang.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Lang", function() { return Lang; });
/* harmony import */ var utils_TypeDefs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/base/utils/TypeDefs.ts");
/* harmony import */ var lang_LangSeqTreeNode__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/base/lang/LangSeqTreeNode.ts");


class Lang extends utils_TypeDefs__WEBPACK_IMPORTED_MODULE_0__["Lang"] {
    constructor(classIf, forwardDict) {
        super();
        this.static = classIf;
        this.treeMap = lang_LangSeqTreeNode__WEBPACK_IMPORTED_MODULE_1__["LangSeqTreeNode"].CREATE_TREE_MAP(forwardDict);
        this.leafNodes = this.treeMap.getLeafNodes();
    }
    get numLeaves() { return this.leafNodes.length; }
    reset() {
        this.treeMap.reset();
    }
    getNonConflictingChar(avoid, balancingScheme) {
        this.leafNodes.sort(lang_LangSeqTreeNode__WEBPACK_IMPORTED_MODULE_1__["LangSeqTreeNode"].LEAF_CMP[balancingScheme]);
        let nodeToHit = undefined;
        for (const leaf of this.leafNodes) {
            const upstreamNodes = leaf.andNonRootParents();
            for (let i = 0; i < upstreamNodes.length; i++) {
                const conflictSeq = avoid.find(avoidSeq => {
                    return avoidSeq.startsWith(upstreamNodes[i].sequence);
                });
                if (conflictSeq) {
                    if (conflictSeq === upstreamNodes[i].sequence) {
                        upstreamNodes.splice(0);
                    }
                    else {
                        upstreamNodes.splice(i);
                    }
                    break;
                }
            }
            if (upstreamNodes.length) {
                upstreamNodes.sort(lang_LangSeqTreeNode__WEBPACK_IMPORTED_MODULE_1__["LangSeqTreeNode"].PATH_CMP[balancingScheme]);
                nodeToHit = upstreamNodes[0];
                break;
            }
        }
        if (!nodeToHit) {
            throw new Error(`Invariants guaranteeing that a LangSeq can`
                + `always be shuffled-in were not met.`);
        }
        return nodeToHit.chooseOnePair(balancingScheme);
    }
    simpleView() {
        return Object.assign(Object.create(null), {
            name: this.static.getName(),
            desc: this.static.getBlurb(),
            root: this.treeMap.simpleView(),
        });
    }
}
(function (Lang) {
    ;
    let Seq;
    (function (Seq) {
        Seq.REGEXP = new RegExp("^[a-zA-Z\-.]+$");
    })(Seq = Lang.Seq || (Lang.Seq = {}));
})(Lang || (Lang = {}));
Object.freeze(Lang);
Object.freeze(Lang.prototype);


/***/ }),

/***/ "./src/base/lang/LangSeqTreeNode.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BalancingScheme", function() { return BalancingScheme; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LangSeqTreeNode", function() { return LangSeqTreeNode; });
/* harmony import */ var lang_Lang__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/base/lang/Lang.ts");

var BalancingScheme;
(function (BalancingScheme) {
    BalancingScheme["SEQ"] = "SEQ";
    BalancingScheme["CHAR"] = "CHAR";
    BalancingScheme["WEIGHT"] = "WEIGHT";
})(BalancingScheme || (BalancingScheme = {}));
class LangSeqTreeNode {
    constructor(parent, sequence, characters) {
        this.sequence = sequence;
        this.characters = characters;
        this.parent = parent;
        this.children = [];
    }
    static CREATE_TREE_MAP(forwardDict) {
        const reverseDict = new Map();
        for (const char in forwardDict) {
            const seq = forwardDict[char].seq;
            const weightedChar = new WeightedLangChar(char, forwardDict[char].weight);
            const charArray = reverseDict.get(seq);
            if (charArray) {
                charArray.push(weightedChar);
            }
            else {
                reverseDict.set(seq, [weightedChar,]);
            }
        }
        const rootNode = new LangSeqTreeNode.Root();
        Array.from(reverseDict)
            .sort((mappingA, mappingB) => mappingA[0].length - mappingB[0].length)
            .forEach((mapping) => {
            rootNode.addCharMapping(...mapping);
        });
        rootNode.finalize();
        return rootNode;
    }
    finalize() {
        this.validateConstruction();
        Object.freeze(this.characters);
        Object.freeze(this.children);
        this.children.forEach((child) => child.finalize());
    }
    validateConstruction() {
        if (!(this.sequence.startsWith(this.parent.sequence))) {
            throw new Error("Child node's sequence must start with that of its parent.");
        }
    }
    reset() {
        this.children.forEach((child) => child.reset());
        this.inheritingHitCount = 0;
        this.inheritingWeightedHitCount = 0.000;
        this.characters.forEach((char) => {
            char.reset();
            for (let i = 0; i < Math.random() * 10; i++) {
                this.incrementNumHits(char);
            }
        });
    }
    addCharMapping(seq, chars) {
        if (!(lang_Lang__WEBPACK_IMPORTED_MODULE_0__["Lang"].Seq.REGEXP.test(seq))) {
            throw new RangeError(`Mapping-sequence \"${seq}\" did not match the`
                + ` required regular expression \"${lang_Lang__WEBPACK_IMPORTED_MODULE_0__["Lang"].Seq.REGEXP.source}\".`);
        }
        else if (chars.length === 0) {
            throw new Error("Must not make mapping without written characters.");
        }
        let node = this;
        {
            let childNode = this;
            while (childNode) {
                node = childNode;
                childNode = childNode.children.find((child) => seq.startsWith(child.sequence));
            }
        }
        if (node.sequence === seq) {
            throw new Error(`Mappings for all written-characters with a common`
                + `corresponding typeable-sequence should be registered together,`
                + `but an existing mapping for the sequence \"${seq}\" was found.`);
        }
        node.children.push(new LangSeqTreeNode(node, seq, chars));
    }
    chooseOnePair(balancingScheme) {
        const weightedChar = this.characters.slice(0)
            .sort(WeightedLangChar.CMP[balancingScheme])
            .shift();
        const pair = {
            char: weightedChar.char,
            seq: this.sequence,
        };
        this.incrementNumHits(weightedChar);
        return pair;
    }
    incrementNumHits(hitWeightedChar) {
        hitWeightedChar.incrementNumHits();
        this.__recursiveIncrementNumHits(hitWeightedChar.weightInv);
    }
    __recursiveIncrementNumHits(weightInv) {
        this.inheritingHitCount += 1;
        this.inheritingWeightedHitCount += weightInv;
        this.children.forEach((child) => child.__recursiveIncrementNumHits(weightInv));
    }
    get personalHitCount() {
        return this.inheritingHitCount - (this.parent).inheritingHitCount;
    }
    get averageCharHitCount() {
        return (this.characters.reduce((prev, curr) => prev + curr.hitCount, 0)
            / this.characters.length);
    }
    get personalWeightedHitCount() {
        return this.inheritingWeightedHitCount - (this.parent).inheritingWeightedHitCount;
    }
    andNonRootParents() {
        const upstreamNodes = [];
        let node = this;
        while (node.parent) {
            upstreamNodes.push(node);
            node = node.parent;
        }
        return upstreamNodes;
    }
    getLeafNodes() {
        const leafNodes = [];
        this.__recursiveGetLeafNodes(leafNodes);
        return leafNodes;
    }
    __recursiveGetLeafNodes(leafNodes) {
        if (this.children.length) {
            this.children.forEach((child) => {
                child.__recursiveGetLeafNodes(leafNodes);
            });
        }
        else {
            leafNodes.push(this);
        }
    }
    simpleView() {
        let chars = this.characters.map((char) => char.simpleView());
        return Object.assign(Object.create(null), {
            seq: this.sequence,
            chars: (chars.length === 1) ? chars[0] : chars,
            hits: this.personalHitCount,
            kids: this.children.map((child) => child.simpleView()),
            __proto__: undefined,
        });
    }
}
LangSeqTreeNode.LEAF_CMP = Object.freeze({
    [BalancingScheme.SEQ]: ((a, b) => a.inheritingHitCount - b.inheritingHitCount),
    [BalancingScheme.CHAR]: ((a, b) => a.inheritingHitCount - b.inheritingHitCount),
    [BalancingScheme.WEIGHT]: ((a, b) => a.inheritingWeightedHitCount - b.inheritingWeightedHitCount),
});
LangSeqTreeNode.PATH_CMP = Object.freeze({
    [BalancingScheme.SEQ]: ((a, b) => a.personalHitCount - b.personalHitCount),
    [BalancingScheme.CHAR]: ((a, b) => a.averageCharHitCount - b.averageCharHitCount),
    [BalancingScheme.WEIGHT]: ((a, b) => a.personalWeightedHitCount - b.personalWeightedHitCount),
});
(function (LangSeqTreeNode) {
    class Root extends LangSeqTreeNode {
        constructor() {
            super(undefined, "", []);
        }
        validateConstruction() {
        }
        chooseOnePair(balancingScheme) {
            throw new TypeError("Must never hit on the root.");
        }
        get personalHitCount() {
            throw new TypeError("Must never hit on the root.");
        }
        get personalWeightedHitCount() {
            throw new TypeError("Must never hit on the root.");
        }
        andNonRootParents() {
            throw new TypeError();
        }
        simpleView() {
            return this.children.map((child) => child.simpleView());
        }
    }
    LangSeqTreeNode.Root = Root;
})(LangSeqTreeNode || (LangSeqTreeNode = {}));
Object.freeze(LangSeqTreeNode);
Object.freeze(LangSeqTreeNode.prototype);
class WeightedLangChar {
    constructor(char, weight) {
        if (weight <= 0) {
            throw new RangeError(`All weights must be positive, but we`
                + ` were passed the value \"${weight}\" for the character`
                + ` \"${char}\".`);
        }
        this.char = char;
        this.weightInv = 1.000 / weight;
    }
    reset() {
        this.hitCount = 0;
        this.weightedHitCount = 0.000;
    }
    incrementNumHits() {
        this.hitCount += 1;
        this.weightedHitCount += this.weightInv;
    }
    simpleView() {
        return Object.assign(Object.create(null), {
            char: this.char,
            hits: this.hitCount,
        });
    }
}
WeightedLangChar.CMP = Object.freeze({
    [BalancingScheme.SEQ]: (a, b) => a.hitCount - b.hitCount,
    [BalancingScheme.CHAR]: (a, b) => a.hitCount - b.hitCount,
    [BalancingScheme.WEIGHT]: (a, b) => a.weightedHitCount - b.weightedHitCount,
});
;
Object.freeze(WeightedLangChar);
Object.freeze(WeightedLangChar.prototype);


/***/ }),

/***/ "./src/base/utils/TypeDefs.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Player", function() { return Player; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Lang", function() { return Lang; });
class Player {
}
(function (Player) {
    Player.Family = Object.freeze({
        HUMAN: "HUMAN",
        CHASER: "CHASER",
    });
    Player.Family;
    let Id;
    (function (Id) {
        Id.NULL = undefined;
    })(Id = Player.Id || (Player.Id = {}));
})(Player || (Player = {}));
Object.freeze(Player);
Object.freeze(Player.prototype);
class Lang {
}
(function (Lang) {
    let CharSeqPair;
    (function (CharSeqPair) {
        CharSeqPair.NULL = Object.freeze({
            char: "",
            seq: "",
        });
    })(CharSeqPair = Lang.CharSeqPair || (Lang.CharSeqPair = {}));
    Lang.Names = Object.freeze({
        ENGLISH__LOWERCASE: {
            display: "English Lowercase (QWERTY)",
            id: "engl-low",
        },
        ENGLISH__MIXEDCASE: {
            display: "English Mixed-Case (QWERTY)",
            id: "engl-mix",
        },
        JAPANESE__HIRAGANA: {
            display: "Japanese Hiragana",
            id: "japn-hir",
        },
        JAPANESE__KATAKANA: {
            display: "Japanese Katakana",
            id: "japn-kat",
        },
        KOREAN__DUBEOLSIK: {
            display: "Korean Dubeolsik (두벌식 키보드)",
            id: "kore-dub",
        },
        KOREAN__SEBEOLSIK: {
            display: "Korean Sebeolsik (세벌식 최종 키보드)",
            id: "kore-sub",
        },
        KOREAN__ROMANIZATION: {
            display: "Korean Revised Romanization",
            id: "kore-rom",
        }
    });
    Lang.Names;
    Lang.__RemapTemplates = Object.freeze({
        IDENTITY: (input) => input,
        TO_LOWER: (input) => input.toLowerCase(),
    });
    Lang.__RemapTemplates;
    Lang.RemappingFunctions = Object.freeze({
        [Lang.Names.ENGLISH__LOWERCASE.id]: Lang.__RemapTemplates.TO_LOWER,
        [Lang.Names.ENGLISH__MIXEDCASE.id]: Lang.__RemapTemplates.IDENTITY,
        [Lang.Names.JAPANESE__HIRAGANA.id]: Lang.__RemapTemplates.TO_LOWER,
        [Lang.Names.JAPANESE__KATAKANA.id]: Lang.__RemapTemplates.TO_LOWER,
        [Lang.Names.KOREAN__DUBEOLSIK.id]: Lang.__RemapTemplates.IDENTITY,
        [Lang.Names.KOREAN__SEBEOLSIK.id]: Lang.__RemapTemplates.IDENTITY,
        [Lang.Names.KOREAN__ROMANIZATION.id]: Lang.__RemapTemplates.TO_LOWER,
    });
})(Lang || (Lang = {}));
Object.freeze(Lang);
Object.freeze(Lang.prototype);


/***/ }),

/***/ "./src/webui/GameSettings.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GameSetting", function() { return GameSetting; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LocalGameSettings", function() { return LocalGameSettings; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GlobalGameSettings", function() { return GlobalGameSettings; });
/* harmony import */ var _Sound__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/webui/Sound.ts");

class GameSetting {
}
class LocalGameSettings {
    constructor() {
        this.sound = new _Sound__WEBPACK_IMPORTED_MODULE_0__["SoundSettings"]();
    }
    static getInstance() {
        if (!LocalGameSettings.SINGLETON) {
            LocalGameSettings.SINGLETON = new LocalGameSettings();
        }
        return LocalGameSettings.SINGLETON;
    }
}
LocalGameSettings.SINGLETON = undefined;
class GlobalGameSettings {
    static getInstance() {
        if (!GlobalGameSettings.SINGLETON) {
            GlobalGameSettings.SINGLETON = new GlobalGameSettings();
        }
        return GlobalGameSettings.SINGLETON;
    }
}
GlobalGameSettings.SINGLETON = undefined;


/***/ }),

/***/ "./src/webui/Sound.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SoundSettings", function() { return SoundSettings; });
class SoundSettings {
    constructor() {
    }
}


/***/ }),

/***/ "./src/webui/WebHooks.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "WebHooks", function() { return WebHooks; });
var WebHooks;
(function (WebHooks) {
    WebHooks.General = Object.freeze({
        Class: Object.freeze({
            FILL_PARENT: "fill-parent",
        })
    });
    WebHooks.Tile = Object.freeze({
        Class: Object.freeze({
            BASE: "tile",
            LANG_CHAR: "tile__char",
            LANG_SEQ: "tile__seq",
        }),
        Dataset: Object.freeze({
            HEALTH: "health",
        }),
    });
    WebHooks.Grid = Object.freeze({
        Id: Object.freeze({
            GRID: "game-grid",
        }),
        Class: Object.freeze({
            GRID: "game-grid",
            IMPL_BODY: "game-grid__impl-body",
            SPOTLIGHT: "game-grid__spotlight",
            KBD_DC_ICON: "game-grid__kbd-dc-icon",
        }),
        Dataset: Object.freeze({
            COORD_SYS: "coordSys",
        }),
    });
    WebHooks.Player = Object.freeze({
        Class: Object.freeze({
            BASE: "player",
            DOWNED_OVERLAY: "player__downed-overlay"
        }),
        Dataset: Object.freeze({
            DOWNED: "downed",
            FACE_SWATCH: "face",
        }),
    });
    let Colour;
    (function (Colour) {
        Colour.Swatch = Object.freeze([
            "mainFg", "mainBg",
            "tileFg", "tileBg", "tileBd",
            "health",
            "pFaceMe",
            "pFaceTeammate", "pFaceImmortalTeammate",
            "pFaceOpponent", "pFaceImmortalOpponent",
        ]);
        Colour.Scheme = Object.freeze({
            ["snakey"]: Object.freeze({
                displayName: "Snakey by N.W.",
            }),
        });
    })(Colour = WebHooks.Colour || (WebHooks.Colour = {}));
    Object.freeze(Colour);
    WebHooks.WebStorageKeys = Object.freeze({
        RecentCoordSystem: "recent-coord-system",
        RecentLang: "recent-lang",
    });
})(WebHooks || (WebHooks = {}));
Object.freeze(WebHooks);


/***/ })

}]);
//# sourceMappingURL=index.js.map