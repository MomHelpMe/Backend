import { Component } from "../core/Component.js";
import { TournamentHistory } from "./Tournament-History.js";

export class TournamentSetting extends Component {

	template () {
		// fetch(){
		//	tournament history 조회
		//}

		this.games = {
			"09/02": '{ "game1": {"Seonjo": 2, "Michang": 1}, "game2": {"Jiko": 3, "Jaehejun": 2}, "game3": {"Seonjo": 2, "Jiko": 3} }',
			"10/02": '{ "game1": {"Jaehejun": 1, "Seonjo": 2}, "game2": {"Michang": 2, "Seunan": 1}, "game3": {"Seonjo": 2, "Michang": 3} }',
			"10/12": '{ "game1": {"Michang": 2, "Jiko": 1}, "game2": {"Seonjo": 3, "Seunan": 2}, "game3": {"Michang": 1, "Seonjo": 3} }',
			"10/25": '{ "game1": {"Jaehejun": 2, "Seunan": 3}, "game2": {"Michang": 3, "Seonjo": 2}, "game3": {"Seunan": 1, "Michang": 2} }',
			"11/12": '{ "game1": {"Jiko": 2, "Jaehejun": 1}, "game2": {"Seunan": 3, "Michang": 2}, "game3": {"Jiko": 2, "Seunan": 3} }',
			"12/25": '{ "game1": {"Michang": 2, "Seunan": 3}, "game2": {"Jiko": 3, "Seonjo": 2}, "game3": {"Seunan": 1, "Jiko": 2} }',
		};
		
		for (let date in this.games) {
			this.games[date] = JSON.parse(this.games[date]);
		}

		console.log(this.games);

		return `
			<div id="tournament-box">
				<div id="tournament-game-menu">Game</div>
				<div id="tournament-history-menu">History</div>
				<div id="tournament-title">Tournament</div>
				<img src="/img/back.png" id="goBack"></img>
				<div id="tournament-main-body">
					<img src="/img/tournament.png" id="tournament-img"></img>
					<div id="tournament-challenge-text">Take on the challenge</div>
				</div>
				<div id="tournament-game-body">
					<div id="tournament-crown-box">
						<img id="crown" src="/img/crown.png"></img>
					</div>
					<div id="tournament-players">
						<div id="tournament-nick">Winner</div>
					</div>
					<div id="tournament-lines">
						<div id="tournament-line1"></div>
					</div>
					<div id="tournament-players">
						<div id="tournament-nick">TBD</div>
						<div id="tournament-nick">TBD</div>
					</div>
					<div id="tournament-lines">
						<div id="tournament-line2"></div>
						<div id="tournament-line2"></div>
					</div>
					<div id="tournament-players">
						<input class="tournament-input" autocomplete="off" id="tournament-nick1" maxlength="8" placeholder="nickname1"></input>
						<input class="tournament-input" autocomplete="off" id="tournament-nick2" maxlength="8" placeholder="nickname2"></input>
						<div id="tournament-blank"></div>
						<input class="tournament-input" autocomplete="off" id="tournament-nick3" maxlength="8" placeholder="nickname3"></input>
						<input class="tournament-input" autocomplete="off" id="tournament-nick4" maxlength="8" placeholder="nickname4"></input>
					</div>
					<div id="tournament-start-button">S T A R T</div>
				</div>
				<div id="tournament-history-body"></div>
			</div>
		`;
	}

	setEvent() {
		this.addEvent('click', '#goBack', (event) => {
			window.history.back();
		});
		
		this.addEvent('click', '#tournament-start-button', (event) => {
			console.log("you press start button!!");
		});

		this.addEvent('click', '#tournament-game-menu', (event) => {
			const gameMenu = document.querySelector('#tournament-game-menu');
			const historyMenu = document.querySelector('#tournament-history-menu');
			const mainBody = document.querySelector('#tournament-main-body');
			const gameBody = document.querySelector('#tournament-game-body');
			const historyBody = document.querySelector('#tournament-history-body');

			gameMenu.style.color = "#6886bd";
			historyMenu.style.color = 'white';
			mainBody.style.display = 'none';
			historyBody.style.display = 'none';
			gameBody.style.display = 'flex';
		});
		
		this.addEvent('click', '#tournament-history-menu', (event) => {
			if (!this.games) return;
			this.game = this.games[this.idx];
			const gameMenu = document.querySelector('#tournament-game-menu');
			const historyMenu = document.querySelector('#tournament-history-menu');
			const mainBody = document.querySelector('#tournament-main-body');
			const gameBody = document.querySelector('#tournament-game-body');
			const historyBody = document.querySelector('#tournament-history-body');
			
			historyMenu.style.color = "#6886bd";
			gameMenu.style.color = 'white';
			mainBody.style.display = 'none';
			gameBody.style.display = 'none';
			historyBody.style.display = 'flex';

			new TournamentHistory(historyBody, { gameInfo: this.games });
		});
	}
}
