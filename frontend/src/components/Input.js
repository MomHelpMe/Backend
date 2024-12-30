import { Component } from "../core/Component.js";

export class Input extends Component {

	template () {
		// console.log(this.props.searchText);
		return `
			<div id="inputBox">
				<input type="text" id="${this.props.inputId}" required autocomplete="off" placeholder="${this.props.searchText}">
				<div id="searchResults" class="search-results"></div>
			</div>
			<img id="${this.props.imageId}" src="${this.props.img}"></img>
		`;
	}
}