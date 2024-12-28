import { GameDefault } from "./Game-Default.js";
import { GameResultPage } from "./Game-Result-Page.js";

export class GameResult extends GameDefault {
	mounted(){
		new GameResultPage(document.querySelector("div#game"), this.props);
	}
}