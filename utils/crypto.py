from cryptography.fernet import Fernet
from base64 import b64encode, b64decode

def generate_key():
    """Generate a new encryption key"""
    return Fernet.generate_key()

def encrypt_message(key, message):
    """
    Encrypt a message using the provided key
    Returns base64 encoded encrypted message
    """
    f = Fernet(key)
    encrypted_data = f.encrypt(message.encode())
    return b64encode(encrypted_data).decode()

def decrypt_message(key, encrypted_message):
    """
    Decrypt a message using the provided key
    Expects base64 encoded encrypted message
    """
    f = Fernet(key)
    encrypted_data = b64decode(encrypted_message.encode())
    decrypted_data = f.decrypt(encrypted_data)
    return decrypted_data.decode()
