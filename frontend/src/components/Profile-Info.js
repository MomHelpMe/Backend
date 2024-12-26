import { Component } from "../core/Component.js";
import { changeUrl } from "../core/router.js";
import { MatchList } from "./Profile-List.js";
import { parseJWT } from "../core/jwt.js";

export class ProfileInfo extends Component {
	
	translate() {
		const languages = {
			0: {
				headText: "Profile",
				winText: "Win",
				loseText: "Lose",
				minText: "min",
				editText: "edit"
			},
			1: {
				headText: "프로필",
				winText: "승리",
				loseText: "패배",
				minText: "분",
				editText: "수정"
			},
			2: {
				headText: "プロフィール",
				winText: "勝ち",
				loseText: "負け",
				minText: "分",
				editText: "編集"
			}
		};
		this.translations = languages[this.props.lan.value];
	}
	
	initState() {
		console.log(this.props.lan.value);
		const payload = parseJWT();
		if (!payload) this.uid = null;
		else this.uid = payload.id;

		this.user = {win: null, lose: null, img_url: null, nickname: null, uid: null};
		this.rate = null;
		this.games = null;

			fetch(`https://localhost:443/api/user/${this.props.uid}`, {
			method: 'GET',
			credentials: 'include', // 쿠키를 포함하여 요청 (사용자 인증 필요 시)
		})
		.then(response => {
			if (!response.ok) {
				throw new Error('Network response was not ok');
x				} else {
				return response.json();
			}
		})
		.then(data => {
			this.state.games = data.games;
			this.state.user = data.user;
			this.state.rate = data.user.lose == 0 ? (data.user.win == 0 ? 0 : 100) :
						Math.round((data.user.win / (data.user.lose + data.user.win)) * 100);
		})
		.catch(error => {
			console.error('Fetch error:', error);
			changeUrl("/");
		});

		return { user: this.user, rate: this.rate, games: this.games };
	}

	template () {
		const translations = this.translations;
		return `
			<div id="profileBox">
				<img src="/img/back.png" id="goBack"></img>
				<div id="profile">
					<div id="profile-left">
						<div id="profileHeaderBox">
							<span id="profileHeader">${translations.headText}</span>
						</div>
						<div id="userInfo">
							<div id="profile-edit">
								${parseInt(this.props.uid) === this.uid ? `<div id="profile-edit-button">${translations.editText}</div>` : ""}
							</div>
							<div id="profileUserName">
								<span id="profileNick">${this.state.user.nickname}</span>
							</div>
							<div id="profileImgBox">
								${this.state.user.img_url === "" ?
									`<img id="profileImg" src="/img/friends.png"></img>` :
									`<img id="profileImg" src="${this.state.user.img_url}"></img>`}
							</div>
						</div>
					</div>
					<div id="profile-right">
						<div id="match">
							<div id="matchInfo">
								<div id="winRateCircle">
									<canvas class="winRateCircle" id="backgroundCanvas" width="200" height="200"></canvas>
									<canvas class="winRateCircle" id="progressCanvas" width="200" height="200"></canvas>
									<div id="percentage"></div>
								</div>
								<div id="winStat">
									<span id="win">${translations.winText} </span><span id="winNum">${this.state.user.win}</span>
									<span id="lose">${translations.loseText} </span><span id="loseNum">${this.state.user.lose}</span>
									<span id="rate">(${this.state.rate}%)</span>
								</div>
							</div>
							<div id="matchHistory">
								<ul id="matches">
								</ul>
							</div>
						</div>
						<div id="history">
						</div>
					</div>
				</div>
			</div>
		`;
	}

	mounted() {
		new MatchList(document.querySelector("ul#matches"), { matches: this.state.games, minText: this.translations.minText });
		this.drawBackgroundCircle();
		this.drawProgressCircle();
		this.updatePercentage();
	}

	setEvent() {
		this.addEvent('click', '#goBack', () => {
			window.history.back();
		});

		this.addEvent('click', '.opNick', (event) => {
			changeUrl(`/main/profile/${event.target.id}`);
		});

		this.addEvent('click', '#profile-edit', () => {
			changeUrl(`/main/profile/${this.props.uid}/edit`);
		});

	}

	drawBackgroundCircle() {
		const canvas = document.getElementById('backgroundCanvas');
		const ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw the background circle
		ctx.beginPath();
		ctx.arc(100, 100, 90, 0, 2 * Math.PI);
		ctx.lineWidth = 20;
		ctx.strokeStyle = '#e74c3c';
		ctx.stroke();
	}

	drawProgressCircle() {
		const canvas = document.getElementById('progressCanvas');
		const ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const startAngle = 1.5 * Math.PI;
		const endAngle = startAngle + (2 * Math.PI * (this.state.rate / 100));

		ctx.beginPath();
		ctx.arc(100, 100, 90, startAngle, endAngle);
		ctx.lineWidth = 20;
		ctx.strokeStyle = '#4074e0';
		ctx.stroke();
	}

	updatePercentage() {
		document.getElementById('percentage').innerText = `${this.state.rate}%`;
	}
}
