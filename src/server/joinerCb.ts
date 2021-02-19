import type * as WebSocket from "ws";
import { JoinerEv } from "defs/OnlineDefs";
import { Group } from "./Group";
import { wss } from "./index";

/** */
export const groups = new Map<string, Group>();


function wssBroadcast(evName: string, _data: any): void {
	const data = JSON.stringify([evName, _data]);
	wss.clients.forEach((s) => s.send(data));
}
/** */
export function wsMessageCb(ev: WebSocket.MessageEvent): void {
	const [evName, ...args] = JSON.parse(ev.data as string) as [string, ...any[]];
	switch (evName) {
	case JoinerEv.Create.NAME: {
		const desc = args[0] as JoinerEv.Create.Req;
		if (Group.isCreateRequestValid(desc) && !groups.has(desc.groupName)) {
			const data = JSON.stringify([JoinerEv.Create.NAME, false]);
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
		const data = JSON.stringify([JoinerEv.Create.NAME, true]);
		ev.target.send(data);
		break;
	}
	case JoinerEv.TryJoin.NAME: {
		const req = args[0] as JoinerEv.TryJoin.Req;
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