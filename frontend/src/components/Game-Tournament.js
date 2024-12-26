import { GameDefault } from "./Game-Default.js";
import { GameTournamentCore } from "./Game-Tournament-Core.js";
import { changeUrl } from "../core/router.js";

export class GameTournament extends GameDefault {
	mounted(){
		const nicknames = JSON.parse(localStorage.getItem("nicknames"));
		const game1 = localStorage.getItem('game1');
		const game2 = localStorage.getItem('game2');
		const game3 = localStorage.getItem('game3');
		if (!game1 && !game2 && !game3) {
			this.props["game"] = 1;
			this.props["player1"] = nicknames["nick1"];
			this.props["player2"] = nicknames["nick2"];
		} else if (game1 && !game2 && !game3) {
			this.props["game"] = 2;
			this.props["player1"] = nicknames["nick3"];
			this.props["player2"] = nicknames["nick4"];
		} else if (game1 && game2 && !game3) {
			this.props["game"] = 3;
			const game1 = JSON.parse(localStorage.getItem('game1'));
			const game2 = JSON.parse(localStorage.getItem('game2'));
			Object.values(nicknames).forEach((nickname) => {
				if (game1.winner === nickname) this.props["player1"] = nickname;
				if (game2.winner === nickname) this.props["player2"] = nickname;
			});
		} else {
			changeUrl("/main/tournament");
		}
		console.log(this.props);
		new GameTournamentCore(document.querySelector("div#game"), this.props);
	}
}