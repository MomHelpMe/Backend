import { Component } from "../core/Component.js";
import { changeUrl } from "../core/router.js";
import host from "./load_host.js";

export class GameResultPage extends Component {

	translate() {
		const languages = {
			0: {
				winnerText: ["Winner is "],
			},

			1: {
				winnerText: ["승자 "],
			},

			2: {
				winnerText: ["勝者 "],
			}
		};
	
		this.translations = languages[this.props.lan.value];
	
	}

	template () {
		const translations = this.translations;
		return `
			<div id="game-result-box">
				<div id="game-winner-box">
					<div id="game-winner">${translations.winnerText}${this.props.winner}!!!</div>
					<div id="game-result-button">OK</div>
				</div>
			</div>
		`;
	}
	
	setEvent() {
		
		function checkNick(nicknames, nick) {
			if (nicknames["nick1"] !== nick &&
				nicknames["nick2"] !== nick &&
				nicknames["nick3"] !== nick &&
				nicknames["nick4"] !== nick) {
				return false;
			}
			return true;
		}

		this.addEvent('click', '#game-result-button', (event) => {
			if (this.props.isTournament){
				const game1 = localStorage.getItem('game1');
				const game2 = localStorage.getItem('game2');
				const game3 = localStorage.getItem('game3');
				if (game1 && !game2 && !game3) {
					changeUrl(`/game/tournament/${this.props.uid}`);
				} else if (game1 && game2 && !game3) {
					changeUrl(`/game/tournament/${this.props.uid}`);
				} else if (game1 && game2 && game3) {
					const nicknames = localStorage.getItem(`nicknames`);
					if (!nicknames) changeUrl("/main/tournament");
					const parsedNicknames = JSON.parse(nicknames);
					const parsedGame1 = JSON.parse(game1);
					const parsedGame2 = JSON.parse(game2);
					const parsedGame3 = JSON.parse(game3);
					
					if (!checkNick(parsedNicknames, parsedGame1.winner) ||
						!checkNick(parsedNicknames, parsedGame1.loser) ||
						!checkNick(parsedNicknames, parsedGame2.winner) ||
						!checkNick(parsedNicknames, parsedGame2.loser) ||
						!checkNick(parsedNicknames, parsedGame3.winner) ||
						!checkNick(parsedNicknames, parsedGame3.loser) ) {
						changeUrl("/main/tournament");
					}
					if (!(parsedGame1.winner === parsedGame3.winner && parsedGame2.winner === parsedGame3.loser) &&
					    !(parsedGame1.winner === parsedGame3.winner && parsedGame2.winner === parsedGame3.loser)) {
							changeUrl("/main/tournament");
					}

					const payload = {
						game_info: JSON.stringify({
							"date": `${new Date().getMonth() + 1}/${new Date().getDate()}`, 
							game1: {
								[parsedNicknames.nick1]: parsedGame1.score1,
								[parsedNicknames.nick2]: parsedGame1.score2
							},
							game2: {
								[parsedNicknames.nick3]: parsedGame2.score1,
								[parsedNicknames.nick4]: parsedGame2.score2
							},
							game3: {
								[parsedGame1.winner]: parsedGame3.score1,
								[parsedGame2.winner]: parsedGame3.score2
							}
						})
					};

					fetch(`https://${host}/api/game-history/tournament`, {
						method: 'POST',
						credentials: 'include', // 쿠키를 포함하여 요청
						headers: {
						  'Content-Type': 'application/json'
						},
						body: JSON.stringify(payload)
					})
					.then(response => {
						if (!response.ok) {
							throw new Error('Failed to send tournament results');
						}
					})
					.catch(error => {
						console.error("Error sending tournament results:", error);
						changeUrl("/");
					});
					changeUrl("/main/tournament");
				} 
				else {
					changeUrl("/main/tournament");
				}
			} else {
				changeUrl("/main", false);
			}			
		});
	}
}
