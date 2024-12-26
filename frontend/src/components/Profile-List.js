import { Component } from "../core/Component.js";

export class MatchList extends Component {

	template () {
		const { matches } = this.props;
		const translations = this.translations;
		if (!matches) return "";
		return `
		  ${matches.map(element => {
			// Date 객체로 변환
			const date = new Date(element.start_timestamp);
			// 월, 일, 시, 분 추출
			const month = date.getMonth() + 1; // getMonth()는 0부터 시작하므로 1을 더해줍니다.
			const day = date.getDate();
			const hours = date.getHours();
			const minutes = date.getMinutes();

			return `
				<li class="matchComponent" id="${element.is_win ?"win":"lose"}Type">
					<div id="matchTime">
						<span id="date">${this.props.dateText}</span>
						<div id="startTime">${month}/${day} ${hours}:${minutes}</div>
						<div id="playTime">${element.playtime}${this.props.minText}</div>
					</div>
					<div id="matchOp">
						<span id="vs">VS</span>
					</div>
					<div id="opImg">
						<span class="opNick" id="${element.op_user.user_id}">${element.op_user.nickname}</span>
						<img id="opImg" src=${element.op_user.img_url}></img>
					</div>
					<div id="matchScore">
						<span id="myScore${element.is_win ?"win":"lose"}">${element.my_score}</span>
						<span id="vsSign"> : </span>
						<span id="opScore">${element.op_score}</span>
					</div>
				</li>`
			}).join('')}
		`;
	}
}