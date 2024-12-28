import { initializeRouter, changeUrl, parsePath } from "./router.js";
import { getCookie } from "./jwt.js";
import { createLoadingElement, addLoadingStyles } from "./loading.js";

const WEBSOCKET_URL = 'wss://localhost:443/ws/online/';

export const closeAllSockets = (socketList) => {
    socketList.forEach(socket => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
            socket.close();
        }
    });
    socketList.length = 0; // 배열 비우기
};

const online = async (socketList) => {
    const token = getCookie("jwt");
    if (!token) {
        changeUrl("/", false);
        return;
    }
    const onlineSocket = new WebSocket(WEBSOCKET_URL);
    socketList.push(onlineSocket);

    onlineSocket.onopen = () => {
        onlineSocket.send(JSON.stringify({ action: 'authenticate', token }));
        console.log("online socket opened");
    };
    onlineSocket.onclose = () => {
        console.log("online socket closed");
        closeAllSockets(socketList);
        changeUrl("/error", false);
    };
};

export const showLoading = async (routes, socketList) => {
    const loadingElement = createLoadingElement();
    document.body.appendChild(loadingElement);
    addLoadingStyles();

    console.log("showLoading");
    console.log("wait 1");

    await Promise.all([
        initializeRouter(routes),
        parsePath(window.location.pathname),
    ]);
    await online(socketList);
    console.log("wait 2");

    setTimeout(() => {
        console.log("wait 3");
        document.body.removeChild(loadingElement);
    }, 1000);
};