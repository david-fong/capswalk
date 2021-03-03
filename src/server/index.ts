import "./PlatformMods";

// Override stack trace to shorten file paths:
process.on("uncaughtException", function processOnUncaughtException(err) {
	const ROOT = path.resolve(__dirname, "../..");
	console.error("\n\n");
	if (err.stack !== undefined) {
		err.stack = err.stack.replace(new RegExp(ROOT.replace(/\\/g, "\\\\"), "g"), ":")
			.split("\n").map(frame => {
				const fn = frame.indexOf("(");
				return fn < 0 ? frame : frame.substring(0, fn) + " ".repeat(Math.max(0, 35-fn)) + frame.substring(fn);
			}).join("\n");
		fs.writeSync(process.stderr.fd, err.stack);
	}
	console.error("\n\n");
	process.exit(1);
});

// =========================================
import os from "os";
import fs from "fs";
import path from "path";
import http from "http";
import express from "express";
import expressStaticGzip from "express-static-gzip";
import WebSocket from "ws";
import type net from "net";
import { SET_SOCKET_ID, SOCKET_ID, JoinerEv } from "defs/OnlineDefs";

const app = express();
const server = http.createServer({}, app);
export const wss = new WebSocket.Server({
	server: server,
});
import { groups, wsMessageCb } from "./joinerCb";


/** EXPRESS ROOT */
// At runtime, __dirname resolves to ":/dist/server/"
const CLIENT_ROOT = path.resolve(__dirname, "../client");
app
.disable("x-powered-by")
.use("/", expressStaticGzip(CLIENT_ROOT, {
	enableBrotli: DEF.PRODUCTION, //🚩 This must match the value in the webpack config.
	serveStatic: {
		setHeaders: (res, path, stat): void => {
			res.setHeader("X-Content-Type-Options", "nosniff");
			const mime = express.static.mime.lookup(path);
			if (mime === "text/html" /* xhtml? */) {
				res.setHeader("Cache-Control", "public, max-age=0");
			}
		},
		// TODO.build enable this when lang term caching is configured for webpack.
		//immutable: DEF.PRODUCTION,
		//maxAge: 31536000000, // 1 year.
	},
}));


/** WSS ON_CONNECTION */
wss.on("connection", function onWsConnect(ws): void {
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
	port: DEF.PRODUCTION ? 443 : 80, // TODO.impl there must be a smarter way to do this.
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