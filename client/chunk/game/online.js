(self.webpackChunksnakey3=self.webpackChunksnakey3||[]).push([[775],{25:(e,t,s)=>{"use strict";s.r(t),s.d(t,{OnlineGame:()=>n});var i=s(655),r=s(502),E=s(153),o=s(699),h=s(191);class n extends h.R{constructor(e,t,s){if(super(E.lA.Type.ONLINE,{onGameBecomeOver:e,tileClass:E.gx,playerStatusCtor:E.Ko},s),this.socket=t,this._ctorBrowserGame(),this.socket.hasListeners(o.a.EVENT_NAME.MOVEMENT))throw new Error("never");if(this.socket.on(o.a.EVENT_NAME.MOVEMENT,this.executePlayerMoveEvent.bind(this)),this.socket.hasListeners(o.a.EVENT_NAME.BUBBLE))throw new Error("never");if(this.socket.on(o.a.EVENT_NAME.BUBBLE,this.executePlayerBubbleEvent.bind(this)),this.socket.off(r.JD.RESET),this.socket.hasListeners(r.JD.RESET))throw new Error("never");this.socket.on(r.JD.RESET,(e=>(0,i.mG)(this,void 0,void 0,(function*(){yield this.reset(),this.deserializeResetState(e),this.socket.emit(r.JD.UNPAUSE)})))),this.socket.emit(r.JD.RESET)}_createArtifPlayer(e){return new E.J5(this,e)}processMoveRequest(e){this.socket.emit(o.a.EVENT_NAME.MOVEMENT,e)}processBubbleRequest(e){this.socket.emit(o.a.EVENT_NAME.BUBBLE,e)}}E.RQ.applyMixins(n,[E.qM]),Object.freeze(n),Object.freeze(n.prototype)}}]);
//# sourceMappingURL=online.js.map