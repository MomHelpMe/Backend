import { createRoutes } from "./core/router.js";
import { showLoading } from "./core/showLoading.js";

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

showLoading(routes, socketList);