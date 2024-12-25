import { Component } from "../core/Component.js";
import { changeUrl } from "../core/router.js";
import { socketList } from "../app.js"


export class WaitForMatch extends Component {

	initState() {
		if (socketList[0] !== undefined)
		{
			console.log("send enter-matching");
			socketList[0].send(JSON.stringify({ 'action': 'enter-matching' }));
			socketList[0].onmessage = (e) => {
				const data = JSON.parse(e.data);
				console.log(data);
				if (data.action === 'start_game') {
					console.log("start game on " + data.room_name);
					changeUrl('/game/vs/' + data.room_name);
				}
			};
		}
		return {};
	}

	template () {
		return `
			<div id="match-box">
				<div id="match-title">Finding Your Match...</div>
				<img src="/img/back.png" id="goBack"></img>
				<div id="matchingRotate">
					<div id="red-box">
						<div id="redBall"></div>
						<div id="redParticle1"></div>
						<div id="redParticle2"></div>
						<div id="redParticle3"></div>
						<div id="redParticle4"></div>
						<div id="redParticle5"></div>
						<div id="redParticle6"></div>
						<div id="redParticle7"></div>
						<div id="redParticle8"></div>
					</div>
					<div id="yellow-box">
						<div id="yellowBall"></div>
						<div id="yellowParticle"></div>
					</div>
				</div>
				<div id="matchingText"></div>
			</div>
		`;
	}

	setEvent() {
		this.addEvent('click', '#goBack', (event) => {
			changeUrl("/main", false);
		});

		const handleSocketClose = (e) => {
			socketList[0].send(JSON.stringify({ 'action': 'leave-matching' }));
			window.removeEventListener('popstate', handleSocketClose);
		}

		window.addEventListener('popstate', handleSocketClose);
	}
}
