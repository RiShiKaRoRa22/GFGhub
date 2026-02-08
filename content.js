console.log(" content.js loaded");


function extractCode() {
  const lines = document.querySelectorAll(".ace_line");
  if (!lines.length) return "";

  return Array.from(lines).map(l => l.innerText).join("\n");
}

function checkAcceptedNow() {
  const headings = document.querySelectorAll("h3");

  for (const h of headings) {
    const text = h.innerText.toLowerCase();
    if (text.includes("problem solved successfully")) {
      return true;
    }
  }
  return false;
}


function sendResult(accepted) {
  const code = extractCode();

  console.log(" Code length:", code.length);
  console.log(" Accepted:", accepted);

  chrome.runtime.sendMessage({
    type: "GFG_SUBMISSION_DATA",
    payload: {title: document.querySelector("h3")?.innerText || "GFG Problem" ,code, accepted }
  });
}


const observer = new MutationObserver(() => {
  if (checkAcceptedNow()) {
    console.log(" Accepted detected via <h3>");
    sendResult(true);
    observer.disconnect();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});


setTimeout(() => {
  if (!checkAcceptedNow()) {
    console.log("No accepted yet, sending false");
    sendResult(false);
  }
}, 10000);
