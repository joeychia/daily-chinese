// Handle PWA loading and updates with spinner
let newWorker = null;
let refreshing = false;

// Create loading spinner element
const updateSpinner = document.createElement('div');
updateSpinner.id = 'pwa-update-spinner';
updateSpinner.style.cssText = `
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  z-index: 9999;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

const spinner = document.createElement('div');
spinner.style.cssText = `
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
`;

const updateText = document.createElement('p');
updateText.textContent = 'Loading app...';
updateText.style.marginTop = '20px';

updateSpinner.appendChild(spinner);
updateSpinner.appendChild(updateText);
document.body.appendChild(updateSpinner);

// Add spinner animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

// Show spinner when update is ready
function showUpdateSpinner(message = 'Updating app...') {
  updateSpinner.style.display = 'flex';
  updateText.textContent = message;
}

// Hide spinner
function hideUpdateSpinner() {
  updateSpinner.style.display = 'none';
}

// Show initial loading spinner
showUpdateSpinner('Loading app...');

// Hide spinner when the page is fully loaded
window.addEventListener('load', () => {
  hideUpdateSpinner();
});

// Handle service worker registration and updates
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateSpinner();
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });
  });

  // Detect controller change and reload page
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}