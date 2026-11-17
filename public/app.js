const statusEl = document.getElementById('status');
const bodyEl = document.getElementById('body');

// Show the response body. JSON is formatted with 2-space indentation,
// anything else (for example plain text) is shown as it is.
function formatBody(text) {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function show(statusText, isOk, body) {
  statusEl.textContent = statusText;
  statusEl.className = isOk ? 'ok' : 'error';
  bodyEl.textContent = body;
}

async function callRoute(method, url) {
  show('Loading...', true, '');
  try {
    // Relative URL: the page and the API come from the same server.
    const response = await fetch(url, { method });
    const text = await response.text();
    show(`${response.status} ${response.statusText}`, response.ok, formatBody(text));
  } catch (error) {
    // Network failure (for example the server is stopped).
    show('Request failed', false, error.message);
  }
}

document.querySelectorAll('button[data-url]').forEach((button) => {
  button.addEventListener('click', () => {
    callRoute(button.dataset.method, button.dataset.url);
  });
});
