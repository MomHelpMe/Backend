import { initializeRouter, createRoutes, changeUrl } from "./core/router.js";
import { getCookie } from "./core/jwt.js";
import dotenv from 'dotenv';

dotenv.config();
const host = process.env.HOST_ADDRESS;

class App {
	app;
	lan;
	constructor() {
		this.app = document.querySelector("#app");
		this.lan = { value: 0 };
	}
}

export const root = new App();
export const routes = createRoutes(root);

export let socketList = [];

const closeAllSockets = () => {
	socketList.forEach(socket => {
		if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
			socket.close();
		}
	});
	socketList = [];
};

const online = () => {
	const onlineSocket = new WebSocket(
		'wss://'
		+ `${host}`
		+ '/ws/online/'
	);
	socketList.push(onlineSocket);

	console.log(onlineSocket);
	onlineSocket.onopen = () => {
		const token = getCookie("jwt");
		onlineSocket.send(JSON.stringify({ 'action': 'authenticate', 'token': token }));
	};
	onlineSocket.onclose = () => {
		console.log("online socket closed");
		closeAllSockets();
		changeUrl("/error", false);
	};
}

initializeRouter(routes);
online();
