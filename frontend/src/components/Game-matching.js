import { GameDefault } from "./Game-Default.js";
import { GameMatchingCore } from "./Game-matching-Core.js";

export class GameMatching extends GameDefault {
	mounted(){
		new GameMatchingCore(document.querySelector("div#game"), this.props);
	}
}