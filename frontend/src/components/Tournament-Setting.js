import { Component } from "../core/Component.js";
import { changeUrl } from "../core/router.js";

export class TournamentSetting extends Component {

	template () {
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
				</div>
				<div id="tournament-start-button">S T A R T</div>
				<div id="tournament-history-body">
				</div>
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
			const startButton = document.querySelector("#tournament-start-button");

			gameMenu.style.color = 'red';
			historyMenu.style.color = 'white';
			mainBody.style.display = 'none';
			historyBody.style.display = 'none';
			gameBody.style.display = 'flex';
			startButton.style.display = 'flex';
		});
		
		this.addEvent('click', '#tournament-history-menu', (event) => {
			const gameMenu = document.querySelector('#tournament-game-menu');
			const historyMenu = document.querySelector('#tournament-history-menu');
			const mainBody = document.querySelector('#tournament-main-body');
			const gameBody = document.querySelector('#tournament-game-body');
			const historyBody = document.querySelector('#tournament-history-body');
			const startButton = document.querySelector("#tournament-start-button");
			
			historyMenu.style.color = 'red';
			gameMenu.style.color = 'white';
			mainBody.style.display = 'none';
			gameBody.style.display = 'none';
			historyBody.style.display = 'flex';
			startButton.style.display = 'none';
		});
	}
}
