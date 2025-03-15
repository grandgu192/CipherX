document.addEventListener('DOMContentLoaded', function() {
    const dataInput = document.getElementById('data');
    const keyInput = document.getElementById('key');
    const encryptBtn = document.getElementById('encryptBtn');
    const decryptBtn = document.getElementById('decryptBtn');
    const resultSection = document.getElementById('resultSection');
    const resultArea = document.getElementById('result');
    const alertBox = document.getElementById('alertBox');
    const copyKeyBtn = document.getElementById('copyKeyBtn');
    const copyResultBtn = document.getElementById('copyResultBtn');

    // Theme Management
    function setTheme(theme) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('theme', theme);
    }

    function setColor(color) {
        document.documentElement.style.setProperty('--theme-color', color);
        localStorage.setItem('themeColor', color);
    }

    // Load saved theme preferences or set defaults
    const savedTheme = localStorage.getItem('theme');
    setTheme(savedTheme || 'dark'); // Set dark as default if no theme is saved

    const colorPicker = document.getElementById('colorPicker');
    const savedColor = localStorage.getItem('themeColor');
    if (savedColor) {
        setColor(savedColor);
        colorPicker.value = savedColor;
    }

    // Add color picker event listener
    colorPicker.addEventListener('input', (e) => {
        setColor(e.target.value);
    });

    // Alert System
    function showAlert(message, type) {
        alertBox.className = `alert alert-${type}`;
        alertBox.textContent = message;
        alertBox.style.display = 'block';
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 5000);
    }

    // Clipboard Functions
    async function copyToClipboard(text, successMessage) {
        try {
            await navigator.clipboard.writeText(text);
            showAlert(successMessage, 'success');
        } catch (err) {
            showAlert('Failed to copy to clipboard', 'danger');
        }
    }

    copyKeyBtn.addEventListener('click', () => {
        if (keyInput.value) {
            copyToClipboard(keyInput.value, 'Key copied to clipboard!');
        }
    });

    copyResultBtn.addEventListener('click', () => {
        if (resultArea.value) {
            copyToClipboard(resultArea.value, 'Result copied to clipboard!');
        }
    });

    // Crypto Operations
    async function performCryptoOperation(operation) {
        const data = dataInput.value.trim();
        const key = keyInput.value.trim();

        if (!data) {
            showAlert('Please enter data to process', 'warning');
            return;
        }

        if (operation === 'decrypt' && !key) {
            showAlert('Please provide a decryption key', 'warning');
            return;
        }

        try {
            const response = await fetch(`/${operation}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    data: data,
                    key: key
                })
            });

            const result = await response.json();

            if (response.ok) {
                if (operation === 'encrypt') {
                    resultArea.value = result.encrypted_data;
                    if (result.key && !key) {
                        keyInput.value = result.key;
                        showAlert('New encryption key generated! Make sure to save it.', 'info');
                    }
                } else {
                    resultArea.value = result.decrypted_data;
                }
                resultSection.style.display = 'block';
            } else {
                showAlert(result.error || 'An error occurred', 'danger');
            }
        } catch (error) {
            showAlert('Failed to process request', 'danger');
            console.error('Error:', error);
        }
    }

    encryptBtn.addEventListener('click', () => performCryptoOperation('encrypt'));
    decryptBtn.addEventListener('click', () => performCryptoOperation('decrypt'));

    // Make theme functions globally available
    window.setTheme = setTheme;
    window.setColor = setColor;
});