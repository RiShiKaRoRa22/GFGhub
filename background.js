let latestCode = "";
let isAccepted = false;

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const REPO = "RiShiKaRoRa22/TEST_gfghub"; // correct

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GFG_SUBMISSION_DATA") {
    latestCode = msg.payload.code;
    isAccepted = msg.payload.accepted;
    console.log("Stored code:", latestCode.length, "Accepted:", isAccepted);
  }

  if (msg.type === "GET_DATA") {
    sendResponse({ code: latestCode, accepted: isAccepted });
  }

  if (msg.type === "PUSH_TO_GITHUB") {
    pushToGitHub(msg.payload);
  }
});

async function pushToGitHub({ title, code }) {
  if (!isAccepted) {
    console.log(" Not accepted, skipping push");
    return;
  }

  try {
    const fileName =
      title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_") + ".java";

    const path = `GFG/${fileName}`;
    const content = btoa(unescape(encodeURIComponent(code)));

    const url = `https://api.github.com/repos/${REPO}/contents/${path}`;

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Add GFG solution: ${title}`,
        content
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "GitHub API error");
    }

    console.log(" Successfully pushed to GitHub:", path);
  } catch (err) {
    console.error(" GitHub push failed:", err.message);
  }
}
