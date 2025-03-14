import os
import logging
from flask import Flask, render_template, request, jsonify
from utils.crypto import generate_key, encrypt_message, decrypt_message
from base64 import b64encode, b64decode
from cryptography.fernet import InvalidToken

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default-secret-key")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/encrypt', methods=['POST'])
def encrypt():
    try:
        data = request.form.get('data', '').strip()
        key = request.form.get('key', '').strip()

        if not data:
            return jsonify({'error': 'Please enter data to encrypt'}), 400

        if not key:
            # Generate a new key if none provided
            key = generate_key()
            key_str = b64encode(key).decode()
        else:
            try:
                # Validate the provided key
                if len(key) % 4 != 0:  # Check if it's valid base64
                    return jsonify({'error': 'Invalid base64 format for key'}), 400
                key = b64decode(key.encode())
                if len(key) != 32:  # Fernet requires 32-byte keys
                    return jsonify({'error': 'Key must be 32 bytes long when decoded'}), 400
                key_str = key.decode()
            except Exception as e:
                logger.error(f"Key validation error: {str(e)}")
                return jsonify({'error': 'Invalid key format. Key must be base64-encoded and 32 bytes when decoded'}), 400

        encrypted_data = encrypt_message(key, data)
        return jsonify({
            'encrypted_data': encrypted_data,
            'key': key_str
        })
    except Exception as e:
        logger.error(f"Encryption error: {str(e)}")
        return jsonify({'error': 'An error occurred during encryption. Make sure all inputs are properly formatted'}), 500

@app.route('/decrypt', methods=['POST'])
def decrypt():
    try:
        encrypted_data = request.form.get('data', '').strip()
        key = request.form.get('key', '').strip()

        if not encrypted_data or not key:
            return jsonify({'error': 'Please provide both encrypted data and key'}), 400

        try:
            if len(key) % 4 != 0:  # Check if it's valid base64
                return jsonify({'error': 'Invalid base64 format for key'}), 400
            key = b64decode(key.encode())
            if len(key) != 32:  # Fernet requires 32-byte keys
                return jsonify({'error': 'Key must be 32 bytes long when decoded'}), 400
        except Exception:
            return jsonify({'error': 'Invalid key format. Key must be base64-encoded and 32 bytes when decoded'}), 400

        try:
            decrypted_data = decrypt_message(key, encrypted_data)
            return jsonify({'decrypted_data': decrypted_data})
        except InvalidToken:
            return jsonify({'error': 'Invalid key or corrupted encrypted data. Make sure you are using the correct key and the complete encrypted text'}), 400
    except Exception as e:
        logger.error(f"Decryption error: {str(e)}")
        return jsonify({'error': 'An error occurred during decryption. Make sure all inputs are properly formatted'}), 500