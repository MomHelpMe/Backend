import { Component } from "../core/Component.js";
import { FriendsInfo } from "./Friends-Info.js";
import { List } from "./List.js";
import { changeUrl, parsePath } from "../core/router.js";
import { Input } from "./Input.js";

export class FriendsList extends Component {

	translate() {
		const languages = {
			0: {
				headText: "Friends List",
				addText: "Add",
				profileText: "View Profile",
				removeText: "Remove",
				searchText: "Search for friends..."
			},
			1: {
				headText: "친구 목록",
				addText: "추가",
				profileText: "프로필 보기",
				removeText: "제거",
				searchText: "친구 검색..."
			},
			2: {
				headText: "友達リスト",
				addText: "追加",
				profileText: "プロフィール",
				removeText: "削除",
				searchText: "友達を探す..."
			}
		};
	
		this.translations = languages[this.props.lan.value];
	
	}

	template () {
		this.info = null;  // friend의 정보
		this.search = null; // add 버튼 눌렀을때 나오는 검색창 객체 (Input)
		const translations = this.translations;
		return `
			<div id="friendsBox">
				<img src="/img/back.png" id="goBack"></img>
				<div id="friendsWindow">
					<div id="friendsMenu">
						<p id="friendsMenu">${translations.headText}</p>
					</div>
					<div id="friendsBody">
						<div id="friendsList">
						<ul id="friendsLists"></ul>
						</div>
						<div id="friendsInfo">
							<div id="defaultImgBox">
								<img id="friendDefaultImg" src="/img/friends.png"></img>
							</div>
						</div>
					</div>
					<div id="friendsEdit">
						<div id="addDiv">
							<div class="friendsEdit" id="addFriend">${translations.addText}</div>
						</div>
						<div id="search"></div>
					</div>
				</div>
			</div>
		`;
	}

	mounted() {
		// API !!! Friends GET
		fetch("https://10.31.5.2/api/friends/", {
			method: 'GET',
			credentials: 'include', // 쿠키를 포함하여 요청
		})
		.then(response => {
			// 응답이 성공적이지 않을 경우 에러를 던집니다.
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		})
		.then(data => {
			this.friends = data; // 응답에서 friends list 꺼내기
		
			// 친구 목록에서 닉네임 리스트를 추출합니다.
			const friendNicknameList = this.friends.map(friend => `${friend.nickname}`);
			const friendIdList = this.friends.map(friend => `${friend.user_id}`);
			// 친구 닉네임 리스트를 이용해 친구 목록 생성
			const ulElement = document.querySelector("ul#friendsLists");
			this.children.push(new List(ulElement, 
				{ className: "fList", ids: friendIdList, contents: friendNicknameList }));
		})
		.catch(error => {
			// console.error('Fetch error:', error);
			changeUrl("/");
		});
	}

	setEvent() {
		this.addEvent('click', '.fList', (event) => {
			const ulElement = document.querySelector("div#friendsInfo");

			// 기존 info가 존재하면, children에서 제거
			if (this.info) {
				const index = this.children.indexOf(this.info);
				if (index !== -1) {
					this.children.splice(index, 1);
				}
			}
			
			const uid = parseInt(event.target.id);
			const friend = this.friends.find(user => user.user_id === uid);
			// 새로운 FriendsInfo 인스턴스를 생성하고, this.children에 추가
			this.info = new FriendsInfo(ulElement, {is_online: friend.is_online, nickname: `${friend.nickname}#${friend.user_id}`,
								 img_url: friend.img_url, profileText: this.translations.profileText, removeText: this.translations.removeText});
			this.children.push(this.info);
		});

		this.addEvent('click', '#goBack', (event) => {
			changeUrl("/main");
		});

		this.addEvent('click', '.goProfile', (event) => {
			const part = event.target.id.split('#');
			const uid = part[1];
			changeUrl(`/main/profile/${uid}`);
		});

		this.addEvent('click', '#addFriend', (event) => {
			const ulElement = document.querySelector("div#search");

			if (this.search) {
				const index = this.children.indexOf(this.search);
				if (index !== -1) this.children.splice(index, 1);
			}
			this.search = new Input(ulElement, {inputId: "searchInput", imageId: "addInputImage", img: "/img/plus.jpeg", searchText: this.translations.searchText});
			this.children.push(this.search);
		});

		function addInput(){
			const searchInput = document.querySelector("input#searchInput");
			const part = searchInput.value.trim().split('#');
			if (part.length !== 2)
			{
				// 올바르지 않은 입력입니다!
				// console.log("invalid input!");
				return ;
			} 
			const nickname = part[0];
            const uid = parseInt(part[1]);

			if (!this.users)
			{
				// console.log("user is not loaded!");
				return ;
			}
			const isFriend = this.friends.find(friend => friend.user_id === uid);
			const isUser = this.users.find(user => user.user_id === uid);
			if (isFriend || !isUser || isUser.nickname !== nickname)
			{
				// console.log("invalid input!");
			}
			else
			{
				// API !!! Friends POST
				fetch("https://10.31.5.2/api/friends/", {
					method: 'POST',
					credentials: 'include', // 쿠키를 포함하여 요청
					headers: {
					  'Content-Type': 'application/json'
					},
					body: JSON.stringify({ user_id: uid })
				})
				.then(response => {
					if (!response.ok) {
						throw new Error('Network response was not ok');
					}
					changeUrl(window.location.pathname);
				})
				.catch(error => {
					// console.error('Fetch error:', error);
					changeUrl("/");
				});
			}
		}

		this.addEvent('keydown', '#addInput', (event) =>{
			if (event.key === 'Enter') { addInput.call(this); } })

		this.addEvent('click', '#addInputImage', () =>{ addInput.call(this); })
		
		this.addEvent('input', '#searchInput', (event) => {
			const searchResults = document.querySelector('#searchResults');
			const part = event.target.value.split('#');
			const nickname = part[0];

			//API !!! userList
			fetch("https://10.31.5.2/api/user/", {
				method: 'GET',
			})
			.then(response => {
				if (!response.ok) throw new Error('Network response was not ok');
				return response.json();
			})
			.then(data => {
				this.users = data; // 응답에서 user list 꺼내기
				const query = nickname.toLowerCase();
				searchResults.innerHTML = ''; // 기존 결과 초기화
	
				if (query.length === 0) {
					searchResults.style.display = 'none'; // 입력값이 없으면 결과 숨김
					return;
				}
	
				const filteredUsers = this.users.filter(user => user.nickname.toLowerCase().startsWith(query));
	
				if (filteredUsers.length > 0) {
					searchResults.style.display = 'block'; // 결과가 있으면 결과 표시
				} else {
					searchResults.style.display = 'none'; // 결과가 없으면 결과 숨김
				}
	
				filteredUsers.forEach(user => {
					const div = document.createElement('div');
					div.className = 'search-result-item';
					div.textContent = `${user.nickname}#${user.user_id}`;
					searchResults.appendChild(div);
				});
			})
			.catch(error => {
				// console.error('Fetch error:', error);
				changeUrl("/");
			});
		})

		this.addEvent('click', '#searchResults', (event) => {
			const searchInput = document.querySelector('#searchInput');
			const searchResults = document.querySelector('#searchResults');
			if (event.target.classList.contains('search-result-item')) {
				searchInput.value = event.target.textContent;
				searchResults.style.display = 'none';
			}
		})
		
		this.addEvent('click', '.removeFriend', (event) => {
			const part = event.target.id.split('#');
			const uid = part[1];

			// API !!! Friends DELETE
			fetch("https://10.31.5.2/api/friends/", {
				method: 'DELETE',
				credentials: 'include', // 쿠키를 포함하여 요청
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ user_id: uid })
			})
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				changeUrl(window.location.pathname);
			})
			.catch(error => {
				// console.error('Fetch error:', error);
				changeUrl("/");
			});
		});
	}
}
