export const API_BASE_URL = 'https://localhost:443/api';

export async function getRequest(endpoint) {
	try {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			method: 'GET',
			credentials: 'include',
		});
		return response;
	} catch (error) {
		console.error('Error:', error);
		return null;
	}
}

export async function postRequest(endpoint, body) {
	try {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		});
		return response;
	} catch (error) {
		console.error('Error:', error);
		return null;
	}
} 