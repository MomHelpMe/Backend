import { Home } from "../components/Home.js";
import { root, routes } from "../app.js";
import { Main } from "../components/Main.js";
import { Friends } from "../components/Friends.js";
import { Profile } from "../components/Profile.js";
import { TwoFA } from "../components/2FA.js";
import { Edit } from "../components/Edit.js";
import { Error404 } from "../components/Error404.js";
import { Match } from "../components/Match.js";
import { Tournament } from "../components/Tournament.js";
import { GameLocal } from "../components/Game-Local.js";
import { GameTournament } from "../components/Game-Tournament.js";
import { GameMatching } from "../components/Game-matching.js";
import { Error } from "../components/Error.js";
import { GameResult } from "../components/Game-Result.js";
import { getRequest, postRequest } from '../utils.js';

export const createRoutes = (root) => {
	return {
		"/": {
			component: (props) => new Home(root.app, props)
		},
		"/main": {
			component: (props) => new Main(root.app, props)
		},
		"/main/friends": {
			component: (props) => new Friends(root.app, props)
		},
		"/main/profile/:uid": {
			component: (props) => new Profile(root.app, props)
		},
		"/2FA": {
			component: (props) => new TwoFA(root.app, props)
		},
		"/main/profile/:uid/edit": {
			component: (props) => new Edit(root.app, props)
		},
		"/404": {
			component: (props) => new Error404(root.app, props)
		},
		"/main/matching": {
			component: (props) => new Match(root.app, props)
		},
		"/main/tournament": {
			component: (props) => new Tournament(root.app, props)
		},
		"/game/local/:uid": {
			component: (props) => new GameLocal(root.app, props),
		},
		"/game/tournament/:uid": {
			component: (props) => new GameTournament(root.app, props),
		},
		"/game/tournament/:uid/result/:winner": {
			component: (props) => {
				props["isTournament"] = true;
				return new GameResult(root.app, props);
			}
		},
		"/game/:uid/result/:winner": {
			component: (props) => {
				props["isTournament"] = false;
				return new GameResult(root.app, props);
			}
		},
		"/game/vs/:room": {
			component: (props) => new GameMatching(root.app, props),
			props: { room: "" }
		},
		"/error": {
			component: (props) => new Error(root.app, props)
		}
	};
};

export const changeUrl = async (requestedUrl, usePushState = true) => {
	if (window.location.pathname !== requestedUrl) {
		if (usePushState) {
			history.pushState(null, null, requestedUrl);
		} else {
			history.replaceState(null, null, requestedUrl);
		}
	}
	await parsePath(requestedUrl);
};

export async function parsePath(path) {
	const urlParams = new URLSearchParams(window.location.search);
	if (urlParams.has('code')) {
		const code = urlParams.get('code');

		// console.log("code:" + code);
		try {
			const response = await postRequest('/callback/', { code });

			if (response && response.status === 200) {
				const data = await response.json();
				if (data.is_2FA) {
					const mailResponse = await getRequest('/send-mail/');

					if (mailResponse && mailResponse.status === 200) {
						return changeUrl("/2FA", false);
					} else {
						return changeUrl("/", false);
					}
				} else {
					const langResponse = await getRequest('/language/');

					if (!langResponse || !langResponse.ok) {
						changeUrl("/");
						return null;
					}

					const langData = await langResponse.json();
					if (langData) {
						// console.log(langData.language);
						root.lan.value = langData.language;
						changeUrl('/main');
						return null;
					}
				}
			} else {
				return changeUrl("/", false);
			}
		} catch (error) {
			// console.error('Error:', error);
			return changeUrl("/error");
		}
	}

	try {
		const isAuthenticated = await checkAuth();
		if ((path === "/" || path === "/2FA") && isAuthenticated) {
			return changeUrl("/main");  // /로 이동할 때 인증되어 있으면 /main으로 이동, replaceState 사용
		} else if ((path !== "/" && path !== "/2FA") && !isAuthenticated) {
			return changeUrl("/", false);  // /를 제외한 다른 경로로 이동할 때 인증되지 않은 경우 /로 이동, replaceState 사용
		}
	} catch (error) {
		// console.error('Error:', error);
		return changeUrl("/error");
	}

	const routeKeys = Object.keys(routes);
	for (const key of routeKeys) {
		const route = routes[key];
		const regex = new RegExp('^' + key.replace(/:\w+/g, '([\\w-]+)') + '$');
		const match = path.match(regex);
		if (match) {
			const props = { lan: root.lan, ...route.props };
			const values = match.slice(1);
			const keys = key.match(/:\w+/g) || [];
			keys.forEach((key, index) => {
				props[key.substring(1)] = values[index];
			});
			// console.log(props);
			route.component(props);
			return;
		}
	}
	changeUrl("/404", false);
}

export const initializeRouter = async () => {
	window.addEventListener("popstate", async () => {
		await parsePath(window.location.pathname);
	});
};

async function checkAuth() {
	const response = await getRequest('/validate/');
	return response ? response.ok : false;
}
