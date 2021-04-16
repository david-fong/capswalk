import type WebSocket from "ws";
import { GroupEv, JoinerEv } from "defs/OnlineDefs";
import { Group } from "./Group";
import { wss } from "./index";

/** */
export const groups = new Map<string, Group>();
function eraseGroup(groupName: string): void { groups.delete(groupName); }

/** */
function _isReqValid(desc: JoinerEv.Create.Req): boolean {
	return (desc.groupName !== undefined)
	&& desc.groupName.length <= Group.Name.MaxLength
	&& Group.Name.REGEXP.test(desc.groupName)
	&& desc.passphrase.length <= Group.Passphrase.MaxLength
	&& Group.Passphrase.REGEXP.test(desc.passphrase);
}
/** */
function wssBroadcast(evName: string, _data: any): void {
	const data = JSON.stringify([evName, _data]);
	wss.clients.forEach((s) => { if (s.readyState === s.OPEN) { s.send(data); }});
}
/** */
export function wsMessageCb(ev: WebSocket.MessageEvent): void {
	const [evName, ...args] = JSON.parse(ev.data as string) as [string, ...any[]];
	switch (evName) {
	/** */
	case JoinerEv.Create.NAME: {
		function _res(val: JoinerEv.Create.Res): void {
			ev.target.send(JSON.stringify([JoinerEv.Create.NAME, val]));
		}
		const desc = args[0] as JoinerEv.Create.Req;
		if (!_isReqValid(desc) || groups.has(desc.groupName)) {
			_res(false); return; //⚡
		}
		groups.set(
			desc.groupName,
			new Group(Object.freeze({
				wssBroadcast: wssBroadcast,
				name: desc.groupName,
				passphrase: desc.passphrase,
				deleteExternalRefs: eraseGroup.bind(null, desc.groupName),
			})),
		);
		// Note that existence of the new group is broadcasted only
		// once the creator of thr group has joined it.
		_res(true); break;
	}
	/** */
	case JoinerEv.TryJoin.NAME: {
		function _res(val: JoinerEv.TryJoin.Res): void {
			ev.target.send(JSON.stringify([JoinerEv.TryJoin.NAME, val]));
		}
		const req = args[0] as JoinerEv.TryJoin.Req;
		const group = groups.get(req.groupName);
		if (
			group === undefined
			|| req.passphrase !== group.passphrase
		) {
			_res(false); return; //⚡
		}
		const userInfo = req.userInfo;
		if (userInfo === undefined || userInfo.teamId !== 0) {
			throw new Error(`a socket attempted to connect to group`
			+` \`${group.name}\` without providing userInfo.`);
		}
		// NOTE: I could make a WeakMap from sockets to their groups,
		// but that would be another global state to manage. Checking
		// every group is kind of stupid, but it's simple and it works.
		for (const group of groups.values()) {
			if (group.kickSocket(ev.target)) break;
		}
		group.admitSocket(ev.target, userInfo);
		_res(true); break;
	}
	/** */
	default: break;
	}
}