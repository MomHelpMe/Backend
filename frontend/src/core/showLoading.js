import { initializeRouter } from "./router.js";
import { changeUrl } from "./router.js";
import { getCookie } from "./jwt.js";
import { parsePath } from "./router.js";

export const closeAllSockets = (socketList) => {
    socketList.forEach(socket => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
            socket.close();
        }
    });
    socketList.length = 0; // 배열 비우기
};

function waitOneSecond(time) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, time); // 1000ms = 1초
    });
  }

export const showLoading = async (routes, socketList) => {
    const online = async () => {
        await waitOneSecond(100);
        const token = getCookie("jwt");
        // if (!token) {
            //     changeUrl("/", false);
            //     return;
            // }
            const onlineSocket = new WebSocket(
            'wss://' + "localhost:443" + '/ws/online/'
            );
        socketList.push(onlineSocket); // socketList에 추가

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

    const loadingElement = document.createElement("div");
    loadingElement.id = "loading";
    loadingElement.style = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    const spinner = document.createElement("div");
    spinner.style = `
        width: 80px;
        height: 80px;
        border: 8px solid rgba(255, 255, 255, 0.2);
        border-top: 8px solid #fff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    `;

    const loadingText = document.createElement("div");
    loadingText.style = `
        position: absolute;
        top: 60%;
        color: white;
        font-size: 24px;
        font-family: Arial, sans-serif;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
        animation: fadeIn 1.5s ease-in-out infinite;
    `;
    loadingText.innerText = "Loading, please wait...";

    loadingElement.appendChild(spinner);
    loadingElement.appendChild(loadingText);
    document.body.appendChild(loadingElement);

    const style = document.createElement("style");
    style.innerHTML = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `;
    document.head.appendChild(style);

    // console.log("showLoading");
    // setTimeout(async () => {
    //     // 1초 뒤에 수행
    //     console.log("wait 1");
        
    //     // parsePath, initializeRouter가 끝날 때까지 기다림
    //     await parsePath(window.location.pathname);
    //     await initializeRouter(routes);
      
    //     // parsePath와 initializeRouter가 끝난 뒤에만 online 호출
    //     console.log("wait 2");
    //     online();
      
    //     // 1초 뒤에 로딩 엘리먼트 제거
    //     setTimeout(() => {
    //       console.log("wait 3");
    //       document.body.removeChild(loadingElement);
    //     }, 1000);
      
    //   }, 1000);

    // console.log("showLoading");
    // setTimeout(async () => {
    //     console.log("wait 1");
    //     await parsePath(window.location.pathname);
    //     await initializeRouter(routes);
    //     setTimeout(() => {
    //         console.log("wait 2");
    //         online(); // online 호출
    //         setTimeout(() => {
    //             console.log("wait 3");
    //             document.body.removeChild(loadingElement);
    //         }, 1000);
    //     }, 2000);
    // }, 1000);
    console.log("showLoading");

    // setTimeout(async () => {
      // 1초 뒤에 수행
      console.log("wait 1");
      
      // parsePath, initializeRouter가 끝날 때까지 기다림
      await parsePath(window.location.pathname);
      await initializeRouter(routes);
      await online();
      // parsePath와 initializeRouter가 끝난 뒤에만 online 호출
      console.log("wait 2");
    
      // 1초 뒤에 로딩 엘리먼트 제거
      setTimeout(() => {
        console.log("wait 3");
        document.body.removeChild(loadingElement);
      }, 1000);
    
    // }, 1000);
};
