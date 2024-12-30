import { Component } from "../core/Component.js";
import { TournamentHistory } from "./Tournament-History.js";
import { parseJWT } from "../core/jwt.js";
import { changeUrl } from "../core/router.js";

export class TournamentSetting extends Component {

	translate() {
		const languages = {
			0: {
				gameText: ["Game"],
				historyText: ["History"],
				startText: ["S T A R T"],
				title: ["Tournament"],
				centerText: ["TAKE ON THE CHALLENGE"],
				winnerText: ["Winner"],
				TBDText: ["TBD"],
				nickText1: ["nickname1"],	
				nickText2: ["nickname2"],	
				nickText3: ["nickname3"],	
				nickText4: ["nickname4"],	
			},
			1: { // 한국어
				gameText: ["게임"],
				historyText: ["기록"],
				startText: ["시 작"],
				title: ["토너먼트"],
				centerText: ["도전에 맞서라"],
				winnerText: ["승자"],
				TBDText: ["미정"],
				nickText1: ["닉네임1"],	
				nickText2: ["닉네임2"],	
				nickText3: ["닉네임3"],	
				nickText4: ["닉네임4"],	
			},
			2: { // 일본어
				gameText: ["ゲーム"],
				historyText: ["履歴"],
				startText: ["ス タ ー ト"],
				title: ["トーナメント"],
				centerText: ["挑戦を受けて立て"],
				winnerText: ["勝者"],
				TBDText: ["未定"],
				nickText1: ["ニックネーム1"],	
				nickText2: ["ニックネーム2"],	
				nickText3: ["ニックネーム3"],	
				nickText4: ["ニックネーム4"],	
			}
		};
	
		this.translations = languages[this.props.lan.value];
	
	}

	template () {
		
		const payload = parseJWT();
		if (!payload) this.uid = null;
		else this.uid = payload.id;

		const translations = this.translations;

		fetch("https://localhost:443/api/game-history/tournament", {
			method: "GET",
			credentials: "include", // 쿠키 포함
		})
		.then(response => {
			if (!response.ok) {
				throw new Error(`Failed to fetch tournament history: ${response.status}`);
			}
			return response.json();
		})
		.then(data => {
			this.games = data.tournaments_list; // 서버에서 받아온 데이터 구조에 맞게 설정
			this.games = this.games.filter(item => {
				return item.game1 && item.game2 && item.game3 && item.date;
			  });
		})
		.catch(error => {
			// console.error("Error fetching tournament history:", error);
			this.games = {}; // 오류 발생 시 기본값 설정
		});
		
		for (let date in this.games) {
			this.games[date] = JSON.parse(this.games[date]);
		}

		// console.log(this.games);

		return `
			<div id="tournament-box">
				<div id="tournament-game-menu">${translations.gameText}</div>
				<div id="tournament-history-menu">${translations.historyText}</div>
				<div id="tournament-title">${translations.title}</div>
				<img src="/img/back.png" id="goBack"></img>
				<div id="tournament-main-body">
					<img src="/img/tournament.png" id="tournament-img"></img>
					<div id="tournament-challenge-text">${translations.centerText}</div>
				</div>
				<div id="tournament-game-body">
					<div id="tournament-nick-error">
						<div id="tournament-nick-error-msg">Please fill in all nickname fields</div>
						<div id="tournament-nick-error-button">OK</div>
					</div>
					<div id="tournament-crown-box">
						<img id="crown" src="/img/crown.png"></img>
					</div>
					<div id="tournament-players">
						<div id="tournament-nick">${translations.winnerText}</div>
					</div>
					<div id="tournament-lines">
						<div id="tournament-line1"></div>
					</div>
					<div id="tournament-players">
						<div id="tournament-nick">${translations.TBDText}</div>
						<div id="tournament-nick">${translations.TBDText}</div>
					</div>
					<div id="tournament-lines">
						<div id="tournament-line2"></div>
						<div id="tournament-line2"></div>
					</div>
					<div id="tournament-players">
						<input class="tournament-input" autocomplete="off" id="tournament-nick1" maxlength="8" placeholder="${translations.nickText1}"></input>
						<input class="tournament-input" autocomplete="off" id="tournament-nick2" maxlength="8" placeholder="${translations.nickText2}"></input>
						<div id="tournament-blank"></div>
						<input class="tournament-input" autocomplete="off" id="tournament-nick3" maxlength="8" placeholder="${translations.nickText3}"></input>
						<input class="tournament-input" autocomplete="off" id="tournament-nick4" maxlength="8" placeholder="${translations.nickText4}"></input>
					</div>
					<div id="tournament-start-button">${translations.startText}</div>
				</div>
				<div id="tournament-history-body"></div>
			</div>
		`;
	}

	setEvent() {
		this.addEvent('click', '#goBack', (event) => {
			changeUrl("/main");
		});

		this.addEvent('click', '#tournament-nick-error-button', (event) => {
			document.querySelector('#tournament-nick-error').style.display = 'none';
		});
		
		this.addEvent('click', '#tournament-start-button', (event) => {
			const nick1 = document.querySelector('#tournament-nick1').value;
			const nick2 = document.querySelector('#tournament-nick2').value;
			const nick3 = document.querySelector('#tournament-nick3').value;
			const nick4 = document.querySelector('#tournament-nick4').value;

			if (nick1 === nick2 || nick1 === nick3 || nick1 === nick4 || nick2 === nick3 || nick2 === nick4 || nick3 === nick4){
				return;
			}

			if (!nick1 || !nick2 || !nick3 || !nick4) {
				document.querySelector('#tournament-nick-error').style.display = 'flex';
				return;
			}

			localStorage.removeItem('game1');
			localStorage.removeItem('game2');
			localStorage.removeItem('game3');

			const nicknames = {nick1, nick2, nick3, nick4};
			localStorage.setItem('nicknames', JSON.stringify(nicknames));

			changeUrl(`/game/tournament/${this.uid}`);
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
