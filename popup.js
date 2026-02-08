const titleEl = document.getElementById("title");
const statusEl = document.getElementById("status");
const pushBtn = document.getElementById("push");
const msgEl = document.getElementById("msg");
const tokenInput = document.getElementById("token");

// Load stored token
chrome.storage.local.get("githubToken", (res) => {
  if (res.githubToken) {
    tokenInput.value = res.githubToken;
  }
});

// Save token
document.getElementById("saveToken").addEventListener("click", () => {
  const token = tokenInput.value.trim();
  if (!token) return;

  chrome.storage.local.set({ githubToken: token }, () => {
    msgEl.textContent = " Token saved";
  });
});

// Get data from background
chrome.runtime.sendMessage({ type: "GET_DATA" }, (res) => {
  if (!res) return;

  titleEl.textContent = res.title || "Unknown Problem";

  if (res.accepted) {
    statusEl.textContent = "Accepted";
    statusEl.className = "status accepted";
    pushBtn.disabled = false;
  } else {
    statusEl.textContent = "Not accepted";
    statusEl.className = "status rejected";
    pushBtn.disabled = true;
  }
});

// Push to GitHub
pushBtn.addEventListener("click", () => {
  msgEl.textContent = " Pushing…";

  chrome.runtime.sendMessage({
    type: "PUSH_TO_GITHUB",
    payload: {}
  });

  msgEl.textContent = "Pushed to GitHub";
});
