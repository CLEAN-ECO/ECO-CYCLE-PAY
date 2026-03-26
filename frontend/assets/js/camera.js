// Check for camera permissions on load
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoElement = document.querySelector('#video-preview');
        if (videoElement) {
            videoElement.srcObject = stream;
        }
    } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Please enable camera permissions to scan plastic.");
    }
}

// Call this when the page loads
window.addEventListener('DOMContentLoaded', startCamera);