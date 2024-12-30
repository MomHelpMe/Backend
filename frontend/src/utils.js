export const API_BASE_URL = "https://localhost:443/api";

// https://docs.djangoproject.com/en/5.1/howto/csrf/#using-csrf-protection-with-ajax
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Generic GET request function with CSRF token
export async function getRequest(endpoint) {
  const csrfToken = getCookie("csrftoken");

  const headers = {};
  if (csrfToken) {
    headers["X-CSRFToken"] = csrfToken;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      credentials: "include",
      headers: headers,
    });
    return response;
  } catch (error) {
    // console.error("Error:", error);
    return null;
  }
}

// Generic POST request function with CSRF token
export async function postRequest(endpoint, body) {
  const csrfToken = getCookie("csrftoken");
  const headers = {
    "Content-Type": "application/json",
  };
  if (csrfToken) {
    headers["X-CSRFToken"] = csrfToken;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      credentials: "include",
      headers: headers,
      body: JSON.stringify(body),
    });
    return response;
  } catch (error) {
    // console.error("Error:", error);
    return null;
  }
}
