(self.webpackChunkcapswalk=self.webpackChunkcapswalk||[]).push([[399],{676:(t,e,s)=>{"use strict";s.d(e,{r:()=>o});var r,i=s(990);class o{constructor(t){Object.freeze(t),this.static=t.Grid,this.dimensions=t.dimensions,this.area=t.Grid.getArea(t.dimensions),i.R.propNoWrite(this,"static","dimensions")}reset(){this.forEach((t=>{this.write(t.coord,{char:"",seq:""})}))}getAllAltDestsThan(t){const e=new Map;return this.tileSourcesTo(t).flatMap((t=>this.tileDestsFrom(t.coord))).forEach((t=>{e.has(t.coord)||e.set(t.coord,t)})),Array.from(e.values()).freeze()}getRandomCoord(){return this.static.getRandomCoord(this.dimensions)}static getSpawnCoords(t,e){const s=new Set;return t.map((t=>{const r=[];for(;t>0;){let i;do{i=this.getRandomCoord(e)}while(s.has(i));r.push(i),s.add(i),t--}return r.freeze()})).freeze()}}(r=o||(o={}))._Constructors={W_EUCLID2:void 0,BEEHIVE:void 0},r.getImplementation=t=>r._Constructors[t],Object.freeze(o),Object.freeze(o.prototype)},17:(t,e,s)=>{"use strict";s.d(e,{v:()=>r});var r,i=s(990),o=s(676);class a{constructor(t){this.dash=t.dash,this.bash=t.bash,Object.freeze(this)}toCoord(){}round(){const t=Math.floor(this.dash),e=Math.floor(this.bash),s=t-this.dash,r=e-this.bash;return s>2*r?new a({dash:t+1,bash:e}):s<.5*r?new a({dash:t,bash:e+1}):Math.min(s,r)>.5?new a({dash:t+1,bash:e+1}):new a({dash:t,bash:e})}add(t){return new a({dash:this.dash+t.dash,bash:this.bash+t.bash})}sub(t){return new a({dash:this.dash-t.dash,bash:this.bash-t.bash})}mul(t){return new a({dash:t*this.dash,bash:t*this.bash})}}Object.freeze(a),Object.freeze(a.prototype),function(t){const e=class extends o.r{constructor(t){super(t),this.grid=(void 0).freeze(),new.target===e&&Object.seal(this)}write(t,e){}moveEntity(t,e,s){}forEach(t){let e=0;for(const s of this.grid)for(const r of s)t(r,e++)}forEachShuffled(t){}getUntToward(t,e){}getUntAwayFrom(t,e){}getAllAltDestsThan(t){return this.tileDestsFrom(t,2)}getRandomCoordAround(t,e){}dist(t,e){}isOccupied(t){}tileAt(t){}tileDestsFrom(t,e=1){return[].freeze()}tileSourcesTo(t,e=1){}static getArea(t){const e=Math.min(t.fslash,t.bslash),s=Math.max(t.fslash,t.bslash),r=-1+t.dash+e;let i=2*e*(t.dash+r);return i+=(s-e-1)*r,i}static getLatticePatchDiameter(t){if(t<.25)throw new RangeError("determinant of a radical will be strictly negative.");return 1+(-3+Math.sqrt(9-12*(1-t)))/6*2}static getRandomCoord(t){return new a(void 0).toCoord()}};let s=e;s.ambiguityThreshold=18,s.sizeLimits=i.R.deepFreeze({dash:{min:10,max:50},bslash:{min:10,max:50},fslash:{min:10,max:50}}),t.Grid=s,i.R.protoNoEnum(s,"tileAt","tileDestsFrom","tileSourcesTo"),Object.freeze(s),Object.freeze(s.prototype)}(r||(r={})),Object.freeze(r)},18:(t,e,s)=>{"use strict";s.d(e,{p:()=>h,K:()=>r});var r,i=s(990),o=s(676),a=(t,e,s)=>{if(!e.has(t))throw TypeError("Cannot "+s)},n=(t,e,s)=>(a(t,e,"read from private field"),s?s.call(t):e.get(t));class h{constructor(t,e){this.x=t,this.y=e,Object.freeze(this)}static from(t,e){return new h(e%t.width,Math.floor(e/t.width))}toCoord(t){return this.y*t.width+this.x}static distX(t,e,s){const r=Math.abs(e.x-s.x);return r<t.width/2?r:t.width-r}static distY(t,e,s){const r=Math.abs(e.y-s.y);return r<t.height/2?r:t.height-r}static oneNorm(t,e,s){return h.distX(t,e,s)+h.distY(t,e,s)}static infNorm(t,e,s){const r=h.distX(t,e,s),i=h.distY(t,e,s);return Math.max(r,i)}static wrapInfo(t,e,s){return Object.freeze({x:Math.abs(s.x-e.x)<t.width/2?0:s.x<e.x?-1:1,y:Math.abs(s.y-e.y)<t.height/2?0:s.y<e.y?-1:1})}static axialAlignment(t,e,s){const r=h.from(t,e),i=h.from(t,s),o=h.distX(t,r,i),a=h.distY(t,r,i);return Math.abs(o-a)/(o+a)}add(t){return new h(this.x+t.x,this.y+t.y)}sub(t){return new h(this.x-t.x,this.y-t.y)}iSub(t){return this.add(this.sub(t))}mul(t){return new h(t*this.x,t*this.y)}mod(t){let{x:e,y:s}=this;for(;e<0;)e+=t.width;for(;s<0;)s+=t.height;return e%=t.width,s%=t.height,new h(e,s)}}Object.freeze(h),Object.freeze(h.prototype),function(t){var e;const s=class extends o.r{constructor(t){var r,o,n;super(t),e.set(this,void 0),r=this,o=e,n=new Uint8Array(this.area),a(r,o,"write to private field"),o.set(r,n);const c=[];for(let t=0;t<this.dimensions.height;t++)for(let e=0;e<this.dimensions.width;e++)c.push({coord:t*this.dimensions.width+e,seq:""});this._grid=c.seal();const d=[];for(let e=0;e<t.dimensions.height;e++)for(let s=0;s<t.dimensions.width;s++)d.push(new h(s,e));this.iacCache=d.freeze(),i.R.instNoEnum(this,"iacCache"),i.R.propNoWrite(this,"_grid","iacCache"),new.target===s&&Object.seal(this)}reset(){super.reset(),n(this,e).fill(0)}write(t,e){this._grid[t]=Object.freeze(Object.assign({},this._grid[t],e))}moveEntity(t,s,r){n(this,e)[s]=0,n(this,e)[r]=1}forEach(t){for(let e=0;e<this.area;e++)t(this._grid[e],e)}forEachShuffled(t){const e=new Uint16Array(this.area);for(let t=0;t<this.area;t++)e[t]=t;e.sort((()=>Math.random()-.5));for(const s of e)t(this._grid[s],s)}getUntToward(t,e){const s=this.tileDestsFrom(e).filter((t=>!this.isOccupied(t.coord))).map((e=>{const s=this.iacCache[e.coord],r=this.iacCache[t];return{tile:e,iac:s,infNorm:h.infNorm(this.dimensions,s,r),oneNorm:h.oneNorm(this.dimensions,s,r)}}));if(0===s.length)return e;s.sort(((t,e)=>t.infNorm-e.infNorm)),s.length=3,s.sort(((t,e)=>t.oneNorm-e.oneNorm));const r=s[0];for(let t=1;t<s.length;t++)if(s[t].infNorm>r.infNorm){s.splice(t);break}if(1===s.length)return r.tile.coord;if(r.infNorm===r.oneNorm){if(h.axialAlignment(this.dimensions,e,t)>.5)return r.tile.coord;s.shift()}return s[Math.floor(s.length*Math.random())].tile.coord}getUntAwayFrom(t,e){const s=this.iacCache[t];return this.iacCache[e].iSub(s).mod(this.dimensions).toCoord(this.dimensions)}getAllAltDestsThan(t){return this.tileDestsFrom(t,2)}getRandomCoordAround(t,e){const s=this.iacCache[t];return new h(s.x+Math.trunc(2*e*(Math.random()-.5)),s.y+Math.trunc(2*e*(Math.random()-.5))).mod(this.dimensions).toCoord(this.dimensions)}dist(t,e){return h.infNorm(this.dimensions,this.iacCache[t],this.iacCache[e])}isOccupied(t){return 0!==n(this,e)[t]}tileAt(t){return this._grid[t]}tileDestsFrom(t,e=1){const s=this.iacCache[t];let r=!1,i=!1;const o=this.dimensions.width,a=this.dimensions.height;let n=s.y-e;n<0&&(n+=a,i=!0);let h=s.x-e;h<0&&(h+=o,r=!0);let c=s.y+e+1;c>a&&(c-=a,i=!0);let d=s.x+e+1;d>o&&(d-=o,r=!0);const l=[];if(r){const t=n*o;l.push(...this._grid.slice(t,t+d).freeze()),i&&l.push(...this._grid.slice(0,d).freeze())}const f=i?a:c,p=2*e+1;for(let t=n;t<f;t++){const e=t*o+h;l.push(...this._grid.slice(e,e+p).freeze())}if(r&&!i&&c!==a&&(l.length-=d),i){for(let t=0;t<c;t++){const e=t*o+h;l.push(...this._grid.slice(e,e+p).freeze())}r&&(l.length-=d)}return l.freeze()}tileSourcesTo(t,e=1){return this.tileDestsFrom(t,e)}static getArea(t){return t.height*t.width}static getLatticePatchDiameter(t){return Math.sqrt(t)}static getRandomCoord(t){const e=Math.floor(t.width*Math.random());return Math.floor(t.height*Math.random())*t.width+e}_assertSomeInvariants(){const t=this._grid.map(((t,e)=>({i:e,arr:this.getAllAltDestsThan(t.coord).map((t=>t.coord)).sort().freeze()}))).filter((t=>25!==t.arr.length)).freeze();if(t.length)throw console.error(t),new Error("never")}};let r=s;e=new WeakMap,r.ambiguityThreshold=24,r.sizeLimits=i.R.deepFreeze({height:{min:5,max:51},width:{min:5,max:51}}),t.Grid=r,r.prototype.tileSourcesTo=r.prototype.tileDestsFrom,i.R.protoNoEnum(r,"tileAt","tileDestsFrom","tileSourcesTo"),Object.freeze(r),Object.freeze(r.prototype)}(r||(r={})),Object.freeze(r)},327:(t,e,s)=>{"use strict";s.d(e,{T:()=>r});var r,i,o=s(183),a=s(477),n=s(990);(i=r||(r={}))._Constructors={W_EUCLID2:void 0,BEEHIVE:void 0},i.getImplementation=t=>i._Constructors[t],i._mkExtensionProps=function(t){t.setAttribute("role","presentation"),t.translate=!1,t.spellcheck=!1;const e=n.R.html("div"),s=e.attachShadow({mode:"closed"});t.classList.add(o.Z["impl-body"]),s.appendChild(t),n.R.Web.adoptStyleSheet(s,"css-common.css"),n.R.Web.adoptStyleSheet(s,"chunk/game-css.css");const r=n.R.html("div",[a.Z["spotlight-short"]]),i=n.R.html("div",[a.Z["spotlight-long"]]),h=Object.freeze([r,i]);return Object.freeze({baseElem:e,spotlightElems:h})},Object.freeze(r)},909:(t,e,s)=>{"use strict";s.d(e,{Z:()=>g});var r,i=s(327),o=s(990),a=s(18),n=s(845),h=(t,e,s)=>{if(!e.has(t))throw TypeError("Cannot "+s)};const c=Object.freeze({tilePattern:"tile-pattern"});function d(t,e){for(const s in e)t.setAttribute(s,e[s])}const l=[[0,0],[0,1],[1,0],[1,1]].freeze();function f(t,e){const s=o.R.svg("g",[n.Z.player]);return d(s,{height:t.height+1,width:t.width+1}),l.forEach((r=>{const i=function(t){const e=o.R.svg("g");d(e,{height:1,width:1,viewBox:"0,0,1,1"});{const t=o.R.svg("rect",[n.Z.tile]);d(t,{height:.8,width:.8,x:.1,y:.1,rx:.1}),e.appendChild(t)}{const s=[...t.avatar].map((t=>t.codePointAt(0).toString(16))).slice(0,-1).join("-"),r=o.R.svg("image");d(r,{href:`https://twemoji.maxcdn.com/v/latest/svg/${s}.svg`,height:1,width:1,alt:t.avatar}),e.appendChild(r)}return e}(e);i.setAttribute("transform",`translate(${r[0]*t.width} ${r[1]*t.height})`),s.appendChild(i)})),s}class p extends a.K.Grid{constructor(t){super(t),r.set(this,void 0);const e=t.dimensions,s=o.R.svg("svg",[n.Z.grid]);d(s,{height:3.3*e.height+"em",width:3.3*e.width+"em",viewBox:`${.5*e.width}, ${.5*e.height}, ${1.5*e.width}, ${1.5*e.height}`}),s.appendChild(function(){const t=o.R.svg("defs");{const e=o.R.svg("pattern");d(e,{id:c.tilePattern,patternUnits:"userSpaceOnUse",height:"1",width:"1",viewBox:"0,0,1,1"});const s=o.R.svg("rect",[n.Z.tile]);d(s,{height:.8,width:.8,x:.1,y:.1,rx:.1}),e.appendChild(s),t.appendChild(e)}return t}());{const t=o.R.svg("rect");d(t,{height:"100%",width:"100%",x:""+.5*e.width,y:""+.5*e.height,fill:`url(#${c.tilePattern})`,role:"presentation"}),s.appendChild(t)}{const i=o.R.svg("g",[n.Z.char]);d(i,{});{const t=[];this.forEach((s=>{const r=function(t,e){const{height:s,width:r}=e,i=[o.R.svg("text"),o.R.svg("text"),o.R.svg("text"),o.R.svg("text")];return d(i[0],{x:t.x+.5,y:t.y+.5}),d(i[1],{x:r+t.x+.5,y:t.y+.5}),d(i[2],{x:t.x+.5,y:s+t.y+.5}),d(i[3],{x:r+t.x+.5,y:s+t.y+.5}),i}(this.iacCache[s.coord],e);t.push(r),r.forEach((t=>i.appendChild(t)))})),a=this,l=r,p=t.freeze(),h(a,l,"write to private field"),l.set(a,p)}i.style.setProperty("--font-scaling",""+t.langCharFontScaling),s.appendChild(i)}var a,l,p;const u=s.cloneNode();u.style.position="absolute",u.style.top="0",this.players=t.players.map(f.bind(null,e)).freeze(),this.players.forEach((t=>u.appendChild(t)));const m=o.R.html("div");m.appendChild(s),m.appendChild(u),Object.assign(this,i.T._mkExtensionProps(m)),Object.seal(this)}write(t,e){var s,i;super.write(t,e),e.char&&(s=this,i=r,h(s,i,"read from private field"),i.get(s))[t].forEach((t=>t.textContent=e.char))}moveEntity(t,e,s){super.moveEntity(t,e,s);const r=this.players[t],i=this.dimensions,o=this.iacCache[e],n=this.iacCache[s],h=a.p.wrapInfo(i,o,n);h.x||h.y?(r.style.transition="none",r.setAttribute("transform",`translate(${o.x+i.width*h.x} ${o.y+i.height*h.y})`),setTimeout((()=>{r.style.transition="",r.setAttribute("transform",`translate(${n.x} ${n.y})`)}),0)):r.setAttribute("transform",`translate(${n.x} ${n.y})`)}}r=new WeakMap,Object.freeze(p),Object.freeze(p.prototype);var u=s(17);class m extends u.v.Grid{constructor(t){super(t),Object.assign(this,i.T._mkExtensionProps(void 0)),Object.seal(this)}write(t,e){}}Object.freeze(m),Object.freeze(m.prototype);const g=()=>{const t=i.T;Object.freeze(Object.assign(t._Constructors,{W_EUCLID2:p,BEEHIVE:m})),Object.freeze(t)}},142:(t,e,s)=>{"use strict";s.d(e,{S:()=>u});var r,i,o,a=s(990),n=s(816),h=s(606),c=s(30),d=s(97),l=(t,e,s)=>{if(!e.has(t))throw TypeError("Cannot "+s)},f=(t,e,s)=>(l(t,e,"read from private field"),s?s.call(t):e.get(t)),p=(t,e,s,r)=>(l(t,e,"write to private field"),r?r.call(t,s):e.set(t,s),s);class u{constructor(t){r.set(this,void 0),i.set(this,void 0),o.set(this,void 0);const{impl:e,desc:s,operatorIds:n}=t;Object.freeze(s),Object.freeze(s.players),s.players.forEach((t=>Object.freeze(t))),Object.freeze(n);const c=h.U.GetDesc(t.desc.langId),l=e.gridClassLookup(s.coordSys);this.grid=new l({Grid:l,system:s.coordSys,dimensions:s.gridDimensions,langCharFontScaling:c.fontScaling,players:s.players}),p(this,r,e.onGameBecomeOver);const f=this._createPlayers(s,e,n,c);this.players=f.players,this.operators=f.operators;{const t=[];this.players.forEach((e=>{t[e.teamId]||(t[e.teamId]=[]),t[e.teamId].push(e)})),this.teams=t.map(((t,e)=>new d.S(e,t)))}a.R.propNoWrite(this,"grid","players","operators","teams"),this.players.forEach((t=>t._onTeamsBootstrapped())),this.setCurrentOperator(0)}reset(){this.grid.reset(),p(this,o,n.l.Status.PAUSED)}_createPlayers(t,e,s,r){const i=t.players.map((t=>t.familyId===c.J.Family.HUMAN?s.includes(t.playerId)?new e.OperatorPlayer(this,t,r):new c.J(this,t):e.RobotPlayer(this,t))).freeze();return Object.freeze({players:i,operators:s.map((t=>i[t])).freeze()})}deserializeResetState(t){a.R.deepFreeze(t),this.grid.forEach(((e,s)=>{this.grid.write(e.coord,t.csps[s])})),t.playerCoords.forEach(((t,e)=>{this.players[e].reset(t)}))}get currentOperator(){return f(this,i)}setCurrentOperator(t){const e=this.operators[t];if(void 0===e)throw new Error("never");this.currentOperator!==e&&p(this,i,e)}get status(){return f(this,o)}statusBecomePlaying(){if(this.status!==n.l.Status.PLAYING){if(this.status!==n.l.Status.PAUSED)throw new Error("Can only resume a game that is currently paused.");this.players.forEach((t=>{t.onGamePlaying()})),p(this,o,n.l.Status.PLAYING)}else console.info("[statusBecomePlaying]: Game is already playing")}statusBecomePaused(){this.status!==n.l.Status.PAUSED?this.status!==n.l.Status.OVER&&(this.players.forEach((t=>{t.onGamePaused()})),p(this,o,n.l.Status.PAUSED)):console.info("[statusBecomePaused]: Game is already paused")}statusBecomeOver(){this.status!==n.l.Status.OVER&&(this.players.forEach((t=>{t.onGameOver()})),p(this,o,n.l.Status.OVER),f(this,r).call(this),console.info("game is over!"))}commitTileMods(t,e){if(void 0!==e.seq){const e=this.grid.tileSourcesTo(t);this.operators.forEach((t=>{e.some((e=>e.coord===t.coord))&&t.seqBufferAcceptKey(void 0)}))}this.grid.write(t,e)}commitStateChange(t,e){a.R.deepFreeze(t);const s=this.players[t.author];if(void 0===t.rejectId){s.reqBuffer.acceptOldest();for(const[e,s]of Object.entries(t.tiles).freeze())this.commitTileMods(parseInt(e),s);for(const[e,s]of Object.entries(t.players).freeze()){const t=this.players[parseInt(e)];if(t.boosts=s.boosts,void 0!==s.coord){const e=t.coord;this.grid.moveEntity(t.playerId,e,s.coord),t._setCoord(s.coord)}}}else s.reqBuffer.reject(t.rejectId,s.coord)}}r=new WeakMap,i=new WeakMap,o=new WeakMap,a.R.protoNoEnum(u,"_createPlayers"),Object.freeze(u),Object.freeze(u.prototype)},831:(t,e,s)=>{"use strict";s.d(e,{i:()=>d});var r,i,o=s(816),a=s(30),n=(t,e,s)=>{if(!e.has(t))throw TypeError("Cannot "+s)},h=(t,e,s)=>(n(t,e,"read from private field"),s?s.call(t):e.get(t)),c=(t,e,s,r)=>(n(t,e,"write to private field"),r?r.call(t,s):e.set(t,s),s);class d extends a.J{constructor(t,e,s){super(t,e),r.set(this,void 0),i.set(this,void 0),Object.seal(this),c(this,i,s.remapFunc)}reset(t){super.reset(t),c(this,r,"")}get seqBuffer(){return h(this,r)}processKeyboardInput(t){this.game.status!==o.l.Status.PLAYING||this.reqBuffer.isFull||(" "===t.key?this.coord!==this.prevCoord&&this.makeMovementRequest(this.game.grid.getUntAwayFrom(this.prevCoord,this.coord),a.J.MoveType.BOOST):1!==t.key.length||t.repeat||this.seqBufferAcceptKey(t.key))}seqBufferAcceptKey(t){const e=this.game.grid.tileDestsFrom(this.reqBuffer.predictedCoord).filter((t=>!this.game.grid.isOccupied(t.coord)));if(0!==e.length)if(void 0!==t){t=h(this,i).call(this,t);for(let s=this.seqBuffer+t;s.length;s=s.substring(1)){const t=e.find((t=>t.seq.startsWith(s)));if(void 0!==t)return c(this,r,s),void(t.seq===s&&this.makeMovementRequest(t.coord,"NORMAL"))}c(this,r,"")}else e.find((t=>t.seq.startsWith(this.seqBuffer)))||c(this,r,"")}_setCoord(t){c(this,r,""),super._setCoord(t)}}r=new WeakMap,i=new WeakMap,Object.freeze(d),Object.freeze(d.prototype)},606:(t,e,s)=>{"use strict";s.d(e,{U:()=>m});var r,i,o,a,n=s(990),h=s(635),c=s(220),d=(t,e,s)=>{if(!e.has(t))throw TypeError("Cannot "+s)},l=(t,e,s)=>(d(t,e,"read from private field"),s?s.call(t):e.get(t)),f=(t,e,s,r)=>(d(t,e,"write to private field"),r?r.call(t,s):e.set(t,s),s);const p=new Map,u=class extends h.Uo{constructor(t,e){super(),r.set(this,void 0),i.set(this,void 0),o.set(this,void 0),a.set(this,void 0),this.desc=u.GetDesc(t),this.csps=p.has(t)?p.get(t):(()=>{const e=Object.getPrototypeOf(this).constructor.BUILD(),s=u.CreateCspsArray(e);return p.set(t,s),s})(),f(this,r,this.csps.length),n.R.propNoWrite(this,"desc","csps");{const t=u.GetWeightScalingFn(e,this.desc.avgWeight);f(this,i,Float32Array.from(this.csps.map((e=>t(e.unscaledWt)))))}f(this,o,new Float64Array(l(this,r))),f(this,a,new Uint16Array(l(this,r)+1)),Object.seal(this)}reset(){for(let t=0;t<l(this,o).length;t++)l(this,o)[t]=Math.random()*u.RESET_NUM_HITS/this.desc.avgWeight;const t=[];l(this,o).forEach(((e,s)=>{t.push(Object.freeze({_hits:e,cspsIndex:s}))})),t.push({_hits:1/0,cspsIndex:l(this,r)}),t.seal().sort(((t,e)=>t._hits-e._hits)).freeze();{let e=l(this,a)[l(this,r)]=t[0].cspsIndex;for(let s=1;s<t.length;s++)e=l(this,a)[e]=t[s].cspsIndex}}getNonConflictingChar(t){t=t.filter((t=>t)).freeze();const e=l(this,a);for(let s=e[l(this,r)],a=l(this,r);s!==l(this,r);a=s,s=e[s]){const n=this.csps[s];if(!t.some((t=>u.EitherPrefixesOther(t,n.seq)))){l(this,o)[s]+=1/l(this,i)[s];let t=s;for(;e[t]!==l(this,r)&&l(this,o)[s]>l(this,o)[e[t]];)t=e[t];return t!==s&&(e[a]=e[s],e[s]=e[t],e[t]=s),n}}throw new Error("never")}_assertInvariants(){const t=[];for(let e=0;e<l(this,r);e++)t[e]=!1;t.seal();let e=l(this,a)[l(this,r)],s=0;for(let i=0;i<l(this,r);i++){if(l(this,o)[e]<s)throw new Error("lang hits should be ascending");s=l(this,o)[e],t[e]=!0,e=l(this,a)[e]}if(e!==l(this,r))throw new Error("lang next should end by looping back");if(t.some((t=>!1===t)))throw new Error("lang next should be an exhaustive loop")}_calcIsolatedMinOpts(){const t=[];this.csps.forEach((e=>{t[t.length-1]!==e.seq&&t.push(e.seq)})),t.freeze();const e=[];for(const s of[...t].seal().reverse().freeze())e.some((t=>t.startsWith(s)))||e.push(s);e.freeze();const s=[];for(const e of t)s.some((t=>t.startsWith(e)))||s.push(e);s.freeze();const r=new Map;return s.forEach((t=>r.set(t,0))),e.forEach((t=>{for(const e of s)if(t.startsWith(e)){r.set(e,r.get(e)+1);break}})),[...r.values()].sort(((t,e)=>t-e)).slice(0,-1).reduce(((t,e)=>t+e),0)}};let m=u;r=new WeakMap,i=new WeakMap,o=new WeakMap,a=new WeakMap,function(t){function e(t){return c.b[t]}async function r(t){const e=c.b[t],r=await s(59)(`./${e.module}.ts`);return e.export.split(".").reduce(((t,e)=>t[e]),r[e.module])}function i(t,e){return 0===t?i.UNIFORM:1===t?i.IDENTITY:s=>Math.pow(s/e,t)}var o;function a(t){return Object.entries(t).freeze().map((([t,{seq:e,weight:s}])=>Object.freeze({char:t,seq:e,unscaledWt:s}))).seal().sort(((t,e)=>e.unscaledWt-t.unscaledWt)).freeze()}let n;t.GetDesc=e,Object.freeze(e),t.Import=r,Object.freeze(r),t.GetWeightScalingFn=i,(o=i=t.GetWeightScalingFn||(t.GetWeightScalingFn={})).UNIFORM=function(){return 1},o.IDENTITY=function(t){return t},Object.freeze(i),t.CreateCspsArray=a,Object.freeze(a),t.RESET_NUM_HITS=10,t.EitherPrefixesOther=function(t,e){return t.length>e.length?t.startsWith(e):e.startsWith(t)},function(t){function e(t){return Object.entries(t).freeze().reduce(((t,[e,s])=>(t[e]={seq:e,weight:s},t)),{})}t.WORD_FOR_WORD=e,Object.freeze(e)}(n=t.BuildUtils||(t.BuildUtils={}))}(m||(m={})),Object.freeze(m),Object.freeze(m.prototype)},59:(t,e,s)=>{var r={"./Chinese.ts":[603,7,330],"./Emote.ts":[896,9,858],"./English.ts":[536,9,184],"./Japanese.ts":[544,9,410],"./Korean.ts":[242,9,227],"./Ngrams.ts":[414,9,273],"./Numpad.ts":[373,9,683],"./Shell.ts":[716,9,159],"./defs/Chinese.ts":[720,7,704],"./defs/English100.ts":[45,9,885]};function i(t){if(!s.o(r,t))return Promise.resolve().then((()=>{var e=new Error("Cannot find module '"+t+"'");throw e.code="MODULE_NOT_FOUND",e}));var e=r[t],i=e[0];return s.e(e[2]).then((()=>s.t(i,16|e[1])))}i.keys=()=>Object.keys(r),i.id=59,t.exports=i}}]);
//# sourceMappingURL=399.js.map