document.addEventListener('DOMContentLoaded', () => {
    const messageContainer = document.getElementById('message-container');

    function showMessage() {
        console.log('showMessage called');
        messageContainer.style.top = ''; // Clear any top positioning
        messageContainer.style.left = '50%';
        messageContainer.style.bottom = '10%';
        messageContainer.style.transform = 'translateX(-50%)';
        messageContainer.classList.remove('hidden');

        // Listen for the end of the typing animation
        messageContainer.addEventListener('animationend', onAnimationEnd);
    }

    function onAnimationEnd(event) {
        if (event.animationName === 'typing') {
            console.log('Typing animation ended');
            // Remove the event listener to avoid multiple triggers
            messageContainer.removeEventListener('animationend', onAnimationEnd);

            // Set the width explicitly to ensure the message remains visible
            messageContainer.style.width = 'auto';

            // Stop the cursor from blinking
            messageContainer.style.borderRight = 'none';
        }
    }

    setTimeout(showMessage, 1000); // Initial delay before showing the message
});