import { Default } from "./Default.js";
import { Menu } from "./Main-Menu.js";

export class Main extends Default {
	mounted(){
		new Menu(document.querySelector("div#contents"), this.props);
	}
}