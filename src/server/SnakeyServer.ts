import * as os from "os";
import * as path from "path";
import * as http from "http";
import * as express from "express";
import * as expressStaticGzip from "express-static-gzip";
import * as WebSocket from "ws";
import type * as net from "net";
import { Group } from "./Group";

/**
 * Creates and performs management operations on {@link ServerGame}s.
 */
const app  = express();
const server = http.createServer({}, app);
const wss  = new WebSocket.Server({
	server: server,
});

/**
 * This is only used to maintain object references so that they are
 * not garbage-collection eligible. Keys are Socket.IO namespace
 * names corresponding the the mapped value.
 */
const allGroups = new Map<string, Group>();

const _joinerSocketListeners: Readonly<{
	[evName : string]: (socket: WebSocket, ...args: any[]) => void;
}> = Object.freeze({
	[Group.Exist.EVENT_NAME]: (socket, desc: Group.Query.RequestCreate): void => {
		if (Group.isCreateRequestValid(desc) && !allGroups.has(desc.groupName)) {
			socket.emit(Group.Exist.EVENT_NAME, Group.Exist.RequestCreate.Response.NOPE);
			return;
		}
		allGroups.set(
			desc.groupName,
			new Group(Object.freeze({
				name: desc.groupName,
				passphrase: desc.passphrase,
				deleteExternalRefs: () => allGroups.delete(desc.groupName),
			})),
		);
		socket.emit(Group.Exist.EVENT_NAME, Group.Exist.RequestCreate.Response.OKAY);
	},
	[Group.TryJoin.EVENT_NAME]: (socket, desc: Group.TryJoin.Request) => {
		// Call the connection-event handler:
		this.namespace.use((socket, next) => {
			const handshake = socket.handshake;
			if ((handshake.auth as any).passphrase !== this.passphrase) {
				next(new Error("Incorrect passphrase"));
			}
			const userInfo = (socket.handshake.auth as any).userInfo as Player.UserInfo;
			if (userInfo === undefined || userInfo.teamId !== 0) {
				next(new Error(`a socket attempted to connect to group`
				+ ` \`${this.name}\` without providing userInfo.`));
			}
			return next();
		}).on("connection", this.admitSocket.bind(this));
		group.admitSocket(socket);
	}
});

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

server.listen(<net.ListenOptions>{}, (): void => {
	const info = <net.AddressInfo>server.address();
	console.info(`\n\nServer mounted to: \`${info.address}${info.port}\` using ${info.family}.\n`);
	console.info("This host can be reached at any of the following addresses:\n");
	chooseIPAddress().sort().forEach((address) => {
		console.info(/* ${SkServer.PROTOCOL} */`${address}:${info.port}`);
		// ^We can exclude the protocol since it will get defaulted by the client side.
	});
	console.info("");
});

wss.on("connection", function onJoinerNspsConnection(socket): void {
	console.info(`socket connect (server): ${socket.url}`);
	// Upon connection, immediately send a list of existing groups:
	socket.emit(
		Group.Exist.EVENT_NAME,
		(() => {
			// TODO.design current implementation may suffer when there are many many groups.
			const build: Group.Query.NotifyStatus = {};
			for (const [groupName, group] of allGroups) {
				build[groupName] = (group.isCurrentlyPlayingAGame)
				? Group.Exist.Status.IN_GAME
				: Group.Exist.Status.IN_LOBBY;
			}
			return build;
		})(),
	);
	Object.freeze(Object.entries(_joinerSocketListeners)).forEach(([evName, callback]) => {
		socket.on(evName, callback.bind(null, socket));
	});
});


/**
 * @returns An array of non-internal IP addresses from any of the
 * local host's network interfaces.
 *
 * TODO: change to return a map from each of "public" and "private" to a list of addresses
 * https://en.wikipedia.org/wiki/Private_network
 */
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