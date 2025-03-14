// Utility functions for converting between different formats
const base64ToArrayBuffer = (base64) => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

const stringToArrayBuffer = (str) => {
    return new TextEncoder().encode(str);
};

const arrayBufferToString = (buffer) => {
    return new TextDecoder().decode(buffer);
};

// Generate a secure random key
async function generateKey() {
    // Generate a random 32-byte key
    const key = await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    );
    const exportedKey = await window.crypto.subtle.exportKey("raw", key);
    return arrayBufferToBase64(exportedKey);
}

// Import key from base64 format
async function importKey(keyBase64) {
    const keyData = base64ToArrayBuffer(keyBase64);
    if (keyData.byteLength !== 32) {
        throw new Error("Key must be 32 bytes long");
    }
    return await window.crypto.subtle.importKey(
        "raw",
        keyData,
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    );
}

async function encrypt(text, keyBase64) {
    try {
        const key = await importKey(keyBase64);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedText = stringToArrayBuffer(text);

        const encryptedData = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            encodedText
        );

        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encryptedData.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encryptedData), iv.length);

        return arrayBufferToBase64(combined.buffer);
    } catch (error) {
        throw new Error("Encryption failed: " + error.message);
    }
}

async function decrypt(encryptedBase64, keyBase64) {
    try {
        const key = await importKey(keyBase64);
        const encryptedData = base64ToArrayBuffer(encryptedBase64);

        // Extract IV and data
        const iv = encryptedData.slice(0, 12);
        const data = encryptedData.slice(12);

        const decryptedData = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: new Uint8Array(iv)
            },
            key,
            data
        );

        return arrayBufferToString(decryptedData);
    } catch (error) {
        throw new Error("Decryption failed. Make sure you're using the correct key.");
    }
}

// UI handlers
document.addEventListener('DOMContentLoaded', function() {
    const dataInput = document.getElementById('data');
    const keyInput = document.getElementById('key');
    const generateKeyBtn = document.getElementById('generateKeyBtn');
    const encryptBtn = document.getElementById('encryptBtn');
    const decryptBtn = document.getElementById('decryptBtn');
    const resultSection = document.getElementById('resultSection');
    const resultArea = document.getElementById('result');
    const alertBox = document.getElementById('alertBox');
    const copyKeyBtn = document.getElementById('copyKeyBtn');
    const copyResultBtn = document.getElementById('copyResultBtn');

    function showAlert(message, type) {
        alertBox.className = `alert alert-${type}`;
        alertBox.textContent = message;
        alertBox.style.display = 'block';
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 5000);
    }

    async function copyToClipboard(text, successMessage) {
        try {
            await navigator.clipboard.writeText(text);
            showAlert(successMessage, 'success');
        } catch (err) {
            showAlert('Failed to copy to clipboard', 'danger');
        }
    }

    generateKeyBtn.addEventListener('click', async () => {
        try {
            const key = await generateKey();
            keyInput.value = key;
            showAlert('New encryption key generated!', 'info');
        } catch (error) {
            showAlert('Failed to generate key', 'danger');
        }
    });

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

    encryptBtn.addEventListener('click', async () => {
        const data = dataInput.value.trim();
        let key = keyInput.value.trim();

        if (!data) {
            showAlert('Please enter data to encrypt', 'warning');
            return;
        }

        try {
            if (!key) {
                key = await generateKey();
                keyInput.value = key;
                showAlert('New encryption key generated!', 'info');
            }

            const encrypted = await encrypt(data, key);
            resultArea.value = encrypted;
            resultSection.style.display = 'block';
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    });

    decryptBtn.addEventListener('click', async () => {
        const data = dataInput.value.trim();
        const key = keyInput.value.trim();

        if (!data || !key) {
            showAlert('Please provide both encrypted data and key', 'warning');
            return;
        }

        try {
            const decrypted = await decrypt(data, key);
            resultArea.value = decrypted;
            resultSection.style.display = 'block';
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    });
});