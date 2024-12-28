import { initializeRouter } from "./router.js";
import { changeUrl } from "./router.js";
import { getCookie } from "./jwt.js";
import { parsePath } from "./router.js";
import { createLoadingElement, addLoadingStyles } from "./loading.js";

export const closeAllSockets = (socketList) => {
    socketList.forEach(socket => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
            socket.close();
        }
    });
    socketList.length = 0; // 배열 비우기
};

export const showLoading = async (routes, socketList) => {
    const online = async () => {
        const token = getCookie("jwt");
        if (!token) {
            changeUrl("/", false);
            return;
        }
        const onlineSocket = new WebSocket(
            'wss://' + "localhost:443" + '/ws/online/'
        );
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

    const loadingElement = createLoadingElement();
    document.body.appendChild(loadingElement);
    addLoadingStyles();

    console.log("showLoading");
    console.log("wait 1");

    await parsePath(window.location.pathname);
    await initializeRouter(routes);
    await online();
    console.log("wait 2");

    setTimeout(() => {
        console.log("wait 3");
        document.body.removeChild(loadingElement);
    }, 1000);
};
