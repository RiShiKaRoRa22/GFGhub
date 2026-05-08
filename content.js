console.log(" content.js loaded");


function extractCode() {
  // This will return a Promise that resolves with the full code
  return new Promise((resolve) => {
    // Create a temporary script element to run in page context
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        try {
          const ace = document.querySelector('.ace_editor');
          if (ace && ace.env && ace.env.editor) {
            const code = ace.env.editor.getValue();
            document.dispatchEvent(new CustomEvent('gfgFullCode', { detail: code }));
          } else {
            // Fallback: collect visible lines
            const lines = Array.from(document.querySelectorAll('.ace_line')).map(l => l.innerText);
            document.dispatchEvent(new CustomEvent('gfgFullCode', { detail: lines.join('\\n') }));
          }
        } catch(e) {
          document.dispatchEvent(new CustomEvent('gfgFullCode', { detail: '' }));
        }
      })();
    `;
    document.documentElement.appendChild(script);
    script.remove();

    // Listen for the result
    function handler(e) {
      document.removeEventListener('gfgFullCode', handler);
      resolve(e.detail);
    }
    document.addEventListener('gfgFullCode', handler);
    
    // Timeout fallback
    setTimeout(() => {
      document.removeEventListener('gfgFullCode', handler);
      const lines = document.querySelectorAll(".ace_line");
      const fallback = Array.from(lines).map(l => l.innerText).join("\n");
      resolve(fallback);
    }, 1000);
  });
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


async function sendResult(accepted) {
  const code = accepted ? await extractCode() : "";
  const lineCount = code.split("\n").length;
  console.log("Full code lines captured:", lineCount);
  
  chrome.runtime.sendMessage({
    type: "GFG_SUBMISSION_DATA",
    payload: {
      title: document.querySelector("h3")?.innerText || "GFG Problem",
      code: code,
      accepted: accepted
    }
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
