import "my-type-utils/ModNodePlatform";

// =========================================
import os from "os";
import path from "path";
import http from "http";
import Koa from "koa";
import koaStatic from "koa-static";
import WebSocket from "ws";
import type net from "net";
import { SET_SOCKET_ID, SOCKET_ID, JoinerEv } from ":defs/OnlineDefs";

/** EXPRESS ROOT */
// At runtime, __dirname resolves to ":/dist/server/"
const CLIENT_ROOT = path.resolve(__dirname, "../client");


const app = new Koa()
.use(koaStatic(CLIENT_ROOT, {
	brotli: DEF.PRODUCTION, //🚩 This must match the value in the webpack config.
	format: false,
	setHeaders: (res, path, stats) => {
		res.removeHeader("x-powered-by");
		res.setHeader("X-Content-Type-Options", "nosniff");
	},
	// TODO.build enable this when lang term caching is configured for webpack.
	maxAge: 0,
	immutable: false, // DEF.PRODUCTION
}));


const server = http.createServer({}, app.callback());


export const wss = new WebSocket.Server({
	server: server,
});
import { groups, wsMessageCb } from "./joinerCb";
wss.on("connection", function onWsConnect(ws, req): void {
	//req.socket.remoteAddress // <- how to get the client's IP address.
	// Upon connection, immediately send a list of existing groups:
	const data = JSON.stringify([
		JoinerEv.Exist.NAME,
		(() => {
			// TODO.design current implementation may suffer when there are many many groups.
			const build: TU.NoRo<JoinerEv.Exist.Sse> = {};
			for (const [groupName, group] of groups) {
				build[groupName] = (group.isCurrentlyPlayingAGame)
				? JoinerEv.Exist.Status.IN_GAME
				: JoinerEv.Exist.Status.IN_LOBBY;
			}
			return build;
		})(),
	]);
	SET_SOCKET_ID(ws, `${Date.now().toString()}_${(Math.random() * 100) % 100}`);
	console.info(`socket connect (server): ${SOCKET_ID(ws)}`);
	ws.send(data);
	ws.addEventListener("message", wsMessageCb);
});


/** HTTP LISTEN */
server.listen(<net.ListenOptions>{
	port: DEF.PRODUCTION ? 443 : 8080, // TODO.impl there must be a smarter way to do this.
	host: "0.0.0.0",
}, function onServerListening(): void {
	const info = <net.AddressInfo>server.address();
	console.info(
		`\n\nServer mounted to: \`${info.address}:${info.port}\` using ${info.family}.\n`
		+"This host can be reached at any of the following addresses:\n"
	);
	chooseIPAddress().sort().forEach((address) => {
		console.info(/* ${SkServer.PROTOCOL} */`${address}:${info.port}`);
		// ^We can exclude the protocol since it will get defaulted by the client side.
	});
	console.info("");
});


/**
 * @returns An array of non-internal IP addresses from any of the
 * local host's network interfaces.
 *
 * https://en.wikipedia.org/wiki/Private_network
 */
// TODO: change to return a map from each of "public" and "private" to a list of addresses
export const chooseIPAddress = (): Array<string> => {
	return (Object.values(os.networkInterfaces()).flat() as os.NetworkInterfaceInfo[])
	.filter((info) => {
		return !(info.internal); /* && info.family === "IPv4" */
	})
	.map((info) => {
		if (info.family === "IPv6") {
			return `[${info.address}]`;
		} else {
			return info.address;
		}
	});
};