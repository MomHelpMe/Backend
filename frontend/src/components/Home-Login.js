import { Component } from "../core/Component.js";
import { changeUrl } from "../core/router.js";

export class Login extends Component {
  template() {
    return `
			<div id="loginBox">
				<p id="login">LOGIN</p>
			</div>
		`;
  }

  setEvent() {
    this.addEvent("click", "#login", () => {
      // 로그인 요청
      window.location.href = "https://localhost/api/login/";
    });
  }
}
