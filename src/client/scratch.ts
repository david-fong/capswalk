import * as io from "socket.io-client";

class Scratch {

    public scratch(): void {
        const host = "192.168.0.123";
        window.location.host = host;
        const path = "/group-001";
        const socket = io({
            path,
        });
    }

}