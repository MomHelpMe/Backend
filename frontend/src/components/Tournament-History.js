import { Component } from "../core/Component.js";

export class TournamentHistory extends Component {

	initState() {
		return { idx: 0 };
	}

	template () {

		const { gameInfo } = this.props;

		const game = Object.values(gameInfo)[this.state.idx];
		this.size = Object.keys(gameInfo).length - 1;

		// 게임 1의 데이터
		const date = game.date;
		const game1_nick1 = Object.keys(game.game1)[0];
		const game1_score1 = game.game1[game1_nick1];
		const game1_nick2 = Object.keys(game.game1)[1];
		const game1_score2 = game.game1[game1_nick2];

		// 게임 2의 데이터
		const game2_nick1 = Object.keys(game.game2)[0];
		const game2_score1 = game.game2[game2_nick1];
		const game2_nick2 = Object.keys(game.game2)[1];
		const game2_score2 = game.game2[game2_nick2];

		// 게임 3의 데이터
		const game3_nick1 = Object.keys(game.game3)[0];
		const game3_score1 = game.game3[game3_nick1];
		const game3_nick2 = Object.keys(game.game3)[1];
		const game3_score2 = game.game3[game3_nick2];
	
		return `
			<div id="tournament-crown-box">
				<img id="crown" src="/img/crown.png"></img>
			</div>
			<div id="tournament-players">
				<div class="tournament-win" id="tournament-nick">${game3_score1 > game3_score2 ? game3_nick1 : game3_nick2}</div>
			</div>
			<div id="tournament-lines">
				<div id="tournament-line1">
					<div class="${game3_score1 > game3_score2 ? "tournament-win-score" : "tournament-lose-score"}" id="tournament-left-score">${game3_score1}</div>
					<div class="${game3_score1 < game3_score2 ? "tournament-win-score" : "tournament-lose-score"}" id="tournament-right-score">${game3_score2}</div>
				</div>
			</div>
			<div id="tournament-players">
				<div class="${game3_score1 > game3_score2 ? "tournament-win" : "tournament-lose"}" id="tournament-nick">${game3_nick1}</div>
				<div class="${game3_score1 < game3_score2 ? "tournament-win" : "tournament-lose"}" id="tournament-nick">${game3_nick2}</div>
			</div>
			<div id="tournament-lines">
				<div id="tournament-line2">
					<div class="${game1_score1 > game1_score2 ? "tournament-win-score" : "tournament-lose-score"}" id="tournament-left-score">${game1_score1}</div>
					<div class="${game1_score1 < game1_score2 ? "tournament-win-score" : "tournament-lose-score"}" id="tournament-right-score">${game1_score2}</div>
				</div>
				<div id="tournament-line2">
					<div class="${game2_score1 > game2_score2 ? "tournament-win-score" : "tournament-lose-score"}" id="tournament-left-score">${game2_score1}</div>
					<div class="${game2_score1 < game2_score2 ? "tournament-win-score" : "tournament-lose-score"}" id="tournament-right-score">${game2_score2}</div>
				</div>
			</div>
			<div id="tournament-players">
				<div class="${game1_score1 > game1_score2 ? "tournament-win" : "tournament-lose"}" id="tournament-nick2">${game1_nick1}</div>
				<div class="${game1_score1 < game1_score2 ? "tournament-win" : "tournament-lose"}" id="tournament-nick2">${game1_nick2}</div>
				<div id="tournament-blank"></div>
				<div class="${game2_score1 > game2_score2 ? "tournament-win" : "tournament-lose"}"  id="tournament-nick2">${game2_nick1}</div>
				<div class="${game2_score1 < game2_score2 ? "tournament-win" : "tournament-lose"}" id="tournament-nick2">${game2_nick2}</div>
			</div>
			<div id="tournament-history-button-box">
				<div id="tournament-prev-button"></div>
				<div id="tournament-game-name">${date}</div>
				<div id="tournament-next-button"></div>
			</div>
		`;
	}

	setEvent(){
		this.addEvent('click', '#tournament-prev-button', (event) => {
			console.log("prev");
			console.log(this.state.idx);
			if (this.state.idx > 0) this.state.idx--;
			console.log(this.state.idx);
		});

		this.addEvent('click', '#tournament-next-button', (event) => {
			console.log("next");
			console.log(this.state.idx);
			if (this.state.idx < this.size) this.state.idx++;
			console.log(this.state.idx);
		});
	}
}