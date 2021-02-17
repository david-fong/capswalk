import * as os from "os";
import * as path from "path";
import * as http from "http";
import * as express from "express";
import * as expressStaticGzip from "express-static-gzip";
import * as WebSocket from "ws";
import type * as net from "net";
import { Group } from "./Group";
import { SET_SOCKET_ID } from "defs/OnlineDefs";

const app = express();
const server = http.createServer({}, app);
const wss = new WebSocket.Server({
	server: server,
});

const groups = new Map<string, Group>();


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

wss.on("connection", function onWsConnect(socket): void {
	console.info(`socket connect (server): ${socket.url}`);
	// Upon connection, immediately send a list of existing groups:
	const data = JSON.stringify([
		Group.Exist.EVENT_NAME,
		(() => {
			// TODO.design current implementation may suffer when there are many many groups.
			const build: Group.Exist.NotifyStatus = {};
			for (const [groupName, group] of groups) {
				build[groupName] = (group.isCurrentlyPlayingAGame)
				? Group.Exist.Status.IN_GAME
				: Group.Exist.Status.IN_LOBBY;
			}
			return build;
		})(),
	]);
	SET_SOCKET_ID(socket, `${Date.now().toString()}_${(Math.random() * 100) % 100}`);
	socket.send(data);
	socket.addEventListener("message", socketMessageCb);
});

server.listen(<net.ListenOptions>{}, function httpListener(): void {
	const info = <net.AddressInfo>server.address();
	console.info(
		`\n\nServer mounted to: \`${info.address}${info.port}\` using ${info.family}.\n`
		+"This host can be reached at any of the following addresses:\n"
	);
	chooseIPAddress().sort().forEach((address) => {
		console.info(/* ${SkServer.PROTOCOL} */`${address}:${info.port}`);
		// ^We can exclude the protocol since it will get defaulted by the client side.
	});
	console.info("");
});


function wssBroadcast(evName: string, _data: any): void {
	const data = JSON.stringify(_data);
	wss.clients.forEach((s) => s.send(data));
}
function socketMessageCb(ev: WebSocket.MessageEvent): void {
	const [evName, ...body] = JSON.parse(ev.data as string) as [string, ...any[]];
	switch (evName) {
	case Group.Exist.EVENT_NAME: {
		const desc = body[0] as Group.Exist.Create.Req;
		if (Group.isCreateRequestValid(desc) && !groups.has(desc.groupName)) {
			const data = JSON.stringify([Group.Exist.EVENT_NAME, Group.Exist.Create.Res.NOPE]);
			ev.target.send(data);
			return; //⚡ joined group
		}
		groups.set(
			desc.groupName,
			new Group(Object.freeze({
				wssBroadcast: wssBroadcast,
				name: desc.groupName,
				passphrase: desc.passphrase,
				deleteExternalRefs: () => groups.delete(desc.groupName),
			})),
		);
		const data = JSON.stringify([Group.Exist.EVENT_NAME, Group.Exist.Create.Res.OKAY]);
		ev.target.send(data);
		break;
	}
	case Group.TryJoin.EVENT_NAME: {
		const req = body[0] as Group.TryJoin.Req;
		const group = groups.get(req.groupName);
		if (
			group === undefined
			|| req.passphrase !== group.passphrase
		) {
			return //⚡
		}
		const userInfo = req.userInfo;
		if (userInfo === undefined || userInfo.teamId !== 0) {
			throw new Error(`a socket attempted to connect to group`
			+` \`${group.name}\` without providing userInfo.`);
		}
		group.admitSocket(ev.target, userInfo);
		break;
	}
	default: break;
	}
}

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