document.getElementById("push").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "GET_DATA" }, (res) => {
    if (!res.accepted) {
      alert(" Solution not accepted yet");
      return;
    }

    const title = document.querySelector("h1")?.innerText || "GFG_Solution";

    chrome.runtime.sendMessage({
      type: "PUSH_TO_GITHUB",
      payload: {
        title,
        code: res.code
      }
    });

    alert(" Pushed to GitHub!");
  });
});
