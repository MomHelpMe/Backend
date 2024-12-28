import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { Component } from "../core/Component.js";
import { changeUrl } from "../core/router.js";
import host from "./load_host.js";

export class TwoFA extends Component {
	template() {
		return `
			<div class="d-flex justify-content-center align-items-center vh-100" style="background-color: #eef2f7; font-family: 'Arial', sans-serif;">
				<div class="card p-5 border-0 shadow-lg" style="max-width: 380px; border-radius: 15px;">
					<h1 class="h4 mb-4 text-center text-primary fw-bold">Email Verification</h1>
					<p class="text-center text-muted mb-4">Enter the 6-digit code we sent to your email address:</p>
					<form id="verificationForm" autocomplete="off">
						<div class="d-flex justify-content-center gap-2 mb-4">
							<input type="text" class="form-control text-center code-input" id="digit1" maxlength="1" required autocomplete="off" style="width: 50px; height: 50px; font-size: 24px; border-radius: 10px; border: 2px solid #ddd;">
							<input type="text" class="form-control text-center code-input" id="digit2" maxlength="1" required autocomplete="off" style="width: 50px; height: 50px; font-size: 24px; border-radius: 10px; border: 2px solid #ddd;">
							<input type="text" class="form-control text-center code-input" id="digit3" maxlength="1" required autocomplete="off" style="width: 50px; height: 50px; font-size: 24px; border-radius: 10px; border: 2px solid #ddd;">
							<input type="text" class="form-control text-center code-input" id="digit4" maxlength="1" required autocomplete="off" style="width: 50px; height: 50px; font-size: 24px; border-radius: 10px; border: 2px solid #ddd;">
							<input type="text" class="form-control text-center code-input" id="digit5" maxlength="1" required autocomplete="off" style="width: 50px; height: 50px; font-size: 24px; border-radius: 10px; border: 2px solid #ddd;">
							<input type="text" class="form-control text-center code-input" id="digit6" maxlength="1" required autocomplete="off" style="width: 50px; height: 50px; font-size: 24px; border-radius: 10px; border: 2px solid #ddd;">
						</div>
						<button class="btn btn-primary w-100 py-2 mb-3 fw-bold" id="submit2FA" type="submit" style="border-radius: 10px; background-color: #007bff; border-color: #007bff;">
							Verify
						</button>
					</form>
					<button class="btn btn-secondary w-100 py-2" id="resendButton" style="border-radius: 10px; background-color: #28a745; border-color: #28a745;">
						Resend Code
					</button>
					<p id="message2FA" class="text-center mt-3 text-danger"></p>
				</div>
			</div>
		`;
	}
	
	setEvent() {
		const inputs = document.querySelectorAll('.code-input');
		const messageElement = document.getElementById('message2FA');

		inputs.forEach((input, index) => {
			input.addEventListener('input', (event) => {
				const value = event.target.value;
				if (value.length === 1 && index < inputs.length - 1) {
					inputs[index + 1].focus();
				}
			});
	
			input.addEventListener('keydown', (event) => {
				if (event.key === 'Backspace' && event.target.value === '' && index > 0) {
					inputs[index - 1].focus();
					inputs[index - 1].value = ''; // 이전 칸의 값을 삭제
				}
			});
		});

		this.addEvent('click', '#resendButton', () => {
			// resend msg 전송
			fetch(`https://${host}/api/send-mail/`, {
				method: 'GET',
				credentials: 'include', // 쿠키를 포함하여 요청
			})
			.then(response => {
				if (response.status === 200) {
					messageElement.textContent = "Verification code resent!";
					messageElement.classList.remove('text-danger');
					messageElement.classList.add('text-success');
				} else {
					changeUrl("/", false);
				}
			});
		});

		this.addEvent('submit', '#verificationForm', (event) => {
			event.preventDefault();
			let otpCode = '';
			for (let i = 1; i <= 6; i++) {
				otpCode += document.getElementById('digit' + i).value;
			}
			
			// API code 일치 확인 요청
			fetch(`https://${host}/api/verify-otp/`, {
				method: 'POST',
				credentials: 'include', // 쿠키를 포함하여 요청
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ otp_code: otpCode })
			})
			.then(response => {
				if (response.status === 200) return response.json();
				else return null;
			})
			.then(data => {
				if (data) {
					if (data.success) {
						// API!!! jwt가 있으면 해당 유저의 데이터베이스에서 언어 번호 (0 or 1 or 2) 얻어오기
						fetch(`https://${host}/api/language/`, {
							method: 'GET',
							credentials: 'include', // 쿠키를 포함하여 요청 (사용자 인증 필요 시)
						})
						.then(response => {
							if (!response.ok){
								changeUrl("/");
								return null;
							} 
							return response.json();
						})
						.then(data => {
							if (data){
								this.props.lan.value = data.language;
								changeUrl('/main'); // 메인 페이지로 이동
							}
						});
					} else {
						messageElement.textContent = "Invalid code. Please try again.";
						messageElement.classList.remove('text-success');
						messageElement.classList.add('text-danger');
					}
				} else {
					changeUrl("/", false);
				}
			})
			.catch(error => {
				console.error('Error:', error);
			});
		});
	}
}
