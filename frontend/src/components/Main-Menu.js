import { Component } from "../core/Component.js";
import { List } from "./List.js";
import { changeUrl } from "../core/router.js";
import { parseJWT } from "../core/jwt.js";
import dotenv from 'dotenv';

dotenv.config();
const host = process.env.HOST_ADDRESS;

export class Menu extends Component {
	translate() {
		const languages = {
			0: {
				gameMenuTexts: ["Local Game", "Multi Game", "Tournament"],
				userMenuTexts: ["Friends", "Profile", "Logout"],
			},
			1: {
				gameMenuTexts: ["로컬 게임", "멀티 게임", "토너먼트"],
				userMenuTexts: ["친구", "프로필", "로그아웃"],
			},
			2: {
				gameMenuTexts: ["ローカルゲーム", "マルチゲーム", "トーナメント"],
				userMenuTexts: ["友達", "プロフィール", "ログアウト"],
			}
		};
	
		this.translations = languages[this.props.lan.value];
	
	}

	template () {
		const payload = parseJWT();
		if (!payload) this.uid = null;
		else this.uid = payload.id;

		const translations = this.translations;

		return `
			<div id="menuBox">
				<div id="enButton">English</div>
				<div id="koButton">한국어</div>
				<div id="jpButton">日本語</div>
				<ul id="gameMenu"></ul>
				<ul id="userMenu"></ul>
			</div>
		`;
	}

	mounted(){
		new List(document.querySelector("ul#gameMenu"), { className: "gameMode", ids: ["LocalGame", "MultiGame", "Tournament"], contents: this.translations.gameMenuTexts});
		new List(document.querySelector("ul#userMenu"), { className: "showInfo", ids: ["Friends", "Profile", "Logout"], contents: this.translations.userMenuTexts});
	}
	
	setEvent () {
		
		this.addEvent('click', '#Friends', () => {
			changeUrl("/main/friends");
		});
		
		this.addEvent('click', '#LocalGame', () => {
			changeUrl(`/game/local/${this.uid}`);
		});
		
		this.addEvent('click', "#MultiGame", () => {
			changeUrl("/main/matching");
		});
		
		this.addEvent('click', "#Tournament", () => {
			changeUrl("/main/tournament");
		});
		
		function storeLang(value) {
			fetch(`https://${host}/api/language/`, {
				method: 'PUT',
				credentials: 'include', // 쿠키를 포함하여 요청 (사용자 인증 필요 시)
				headers: {
					'Content-Type': 'application/json' // JSON 데이터임을 명시
				},
				body: JSON.stringify({
					language: value
				})
			})
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
			})
			.catch(error => {
				console.error('Fetch error:', error);
				changeUrl("/");
			});
			changeUrl("/main");
		}
		
		this.addEvent('click', '#enButton', () => {
			this.props.lan.value = 0;
			storeLang(this.props.lan.value);
		});
		
		this.addEvent('click', '#koButton', () => {
			this.props.lan.value = 1;
			storeLang(this.props.lan.value);
		});
		
		this.addEvent('click', '#jpButton', () => {
			this.props.lan.value = 2;
			storeLang(this.props.lan.value);
		});

		this.addEvent('click', '#Profile', () => {
			if (this.uid) changeUrl(`/main/profile/${this.uid}`);
			else changeUrl("/");
		});

		this.addEvent('click', '#Logout', () => {
			// API !! ME POST
			fetch(`https://${host}/api/me/`, {
				method: 'POST',
				credentials: 'include', // 쿠키를 포함하여 요청 (사용자 인증 필요 시)
			})
			.then(response => {
				if (response.ok) changeUrl(`/`);
				else throw new Error('Network response was not ok');
			})
			.catch(error => {
				console.error('Fetch error:', error);
				changeUrl("/");
			});
		});
	}
}
