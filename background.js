let latestCode = "";
let isAccepted = false;
let latestTitle = "";
const REPO = "RiShiKaRoRa22/gfg_solutions";

function sanitizeName(name) {
  return name.trim().replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GFG_SUBMISSION_DATA") {
    latestCode = msg.payload.code;
    isAccepted = msg.payload.accepted;
    latestTitle = msg.payload.title;
    console.log("Stored code (partial):", latestCode.length, "lines:", latestCode.split("\n").length, "Accepted:", isAccepted);

    if (isAccepted && sender.tab && sender.tab.id) {
      console.log("Requesting full code from page context...");
      getFullCodeFromTab(sender.tab.id).then(fullCode => {
        if (fullCode && fullCode.length > latestCode.length) {
          const newLines = fullCode.split("\n").length;
          console.log(`Replaced with full code: ${newLines} lines (was ${latestCode.split("\n").length})`);
          latestCode = fullCode;
        } else {
          console.log("Full code not better, keeping original");
        }
      });
    }
  }

  if (msg.type === "GET_DATA") {
    sendResponse({ code: latestCode, accepted: isAccepted, title: latestTitle });
    return true;
  }

  if (msg.type === "PUSH_TO_GITHUB") {
    pushToGitHub(latestTitle, latestCode);
    return true;
  }
});

async function getFullCodeFromTab(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: "MAIN",
      func: () => {
        // Return a Promise that resolves when we get the full code
        return new Promise((resolve) => {
          let attempts = 0;
          const maxAttempts = 20; // 20 * 200ms = 4 seconds
          
          function tryExtract() {
            const ace = document.querySelector(".ace_editor");
            // Try to get the editor instance
            if (ace && ace.env && ace.env.editor) {
              try {
                const code = ace.env.editor.getValue();
                if (code && code.length > 0) {
                  console.log("[Page] Extracted via Ace instance, lines:", code.split("\n").length);
                  resolve({ code: code, source: "ace" });
                  return;
                }
              } catch(e) { console.error("[Page] Error getting value:", e); }
            }
            
            // Fallback: collect DOM lines
            const lines = Array.from(document.querySelectorAll(".ace_line")).map(l => l.innerText);
            if (lines.length > 0 || attempts >= maxAttempts) {
              console.log("[Page] Fallback to DOM lines, count:", lines.length);
              resolve({ code: lines.join("\n"), source: "dom" });
              return;
            }
            
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(tryExtract, 200);
            } else {
              resolve({ code: "", source: "failed" });
            }
          }
          
          tryExtract();
        });
      }
    });
    
    if (results && results[0] && results[0].result) {
      const { code, source } = results[0].result;
      console.log(`Extraction source: ${source}`);
      return code;
    }
  } catch (err) {
    console.error("Failed to extract full code:", err);
  }
  return null;
}

async function pushToGitHub(title, code) {
  if (!isAccepted) {
    console.log("❌ Not accepted, skipping push");
    return;
  }

  const { githubToken } = await chrome.storage.local.get("githubToken");
  if (!githubToken) {
    console.error("❌ No GitHub token. Save it in the popup!");
    return;
  }

  try {
    const folderName = sanitizeName(title);
    const fileName = "solution.java";
    const path = `${folderName}/${fileName}`;
    const content = btoa(unescape(encodeURIComponent(code)));

    const url = `https://api.github.com/repos/${REPO}/contents/${path}`;
    
    let sha = null;
    try {
      const getRes = await fetch(url, {
        headers: { Authorization: `Bearer ${githubToken}` }
      });
      if (getRes.status === 200) {
        const data = await getRes.json();
        sha = data.sha;
        console.log("File exists, SHA obtained");
      } else if (getRes.status === 404) {
        console.log("File doesn't exist, will create new");
      }
    } catch (e) {
      console.log("Error checking file:", e.message);
    }

    const putRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Add/Update GFG solution: ${title}`,
        content: content,
        sha: sha
      })
    });

    const data = await putRes.json();

    if (putRes.ok) {
      console.log("✅ Successfully pushed to GitHub:", path);
      console.log("📝 Action:", sha ? "Updated existing file" : "Created new file");
    } else {
      console.error("❌ GitHub error:", data.message);
    }
  } catch (err) {
    console.error("❌ Push failed:", err.message);
  }
}