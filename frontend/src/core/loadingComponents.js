export function createLoadingElement() {
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
    return loadingElement;
}

export function addLoadingStyles() {
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
} 