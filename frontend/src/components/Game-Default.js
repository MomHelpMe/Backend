import { Component } from "../core/Component.js";

export class GameDefault extends Component {
	template() {
		return `
		<style>
			#game {
				position: absolute;
				display: flex;
				justify-content: center;
				align-items: center;
				overflow: hidden;
				margin: 0;
				top: 0;
				bottom: 0;
				height: 100%;
				width: 100%;
				flex-direction: column;
				z-index: 1;
			}


			/* 왼쪽 배경 */
				div#leftBG {
				height: 100%;
				width: 50%;
				background-color: #F5F6FA; /* 연한 배경색 */
				display: flex;
				align-items: center;
			}
		
			div#leftBar{
				position: absolute;
				left: 30px;
				width: 30px;
				height: 35%;
				border-radius: 20px;
				background-color: #2f3640;
			}
		
			/* 오른쪽 배경 */
			div#rightBG {
				height: 100%;
				width: 50%;
				background-color: #2f3640; /* 어두운 배경색 */
				display: flex;
				align-items: center;
			}
		
			div#rightBar{
				position: absolute;
				right: 30px;
				width: 30px;
				height: 35%;
				background-color: #F5F6FA;
				border-radius: 20px;
			}
		</style>
		<div id="BG">
			<div id="leftBG">
				<div id="leftBar"></div>
			</div>
			<div id="rightBG">
				<div id="rightBar"></div>
			</div>
			<div id="game">
			</div>
		</div>
		`;
	}
}
