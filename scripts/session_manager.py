import os
from cryptography.fernet import Fernet

def get_fernet_key():
    key = os.environ.get('SESSION_ENCRYPTION_KEY')
    if not key:
        raise ValueError("SESSION_ENCRYPTION_KEY environment variable not set.")
    return Fernet(key.encode())

def decrypt_session(encrypted_session_content, output_path):
    f = get_fernet_key()
    decrypted_content = f.decrypt(encrypted_session_content).decode()
    with open(output_path, 'w') as file:
        file.write(decrypted_content)
    print(f"Session decrypted to {output_path}")

def encrypt_session(input_path):
    f = get_fernet_key()
    with open(input_path, 'r') as file:
        session_content = file.read()
    encrypted_content = f.encrypt(session_content.encode()).decode()
    print(f"Session encrypted from {input_path}")
    return encrypted_content

if __name__ == "__main__":
    action = os.environ.get('ACTION')
    session_file = "arora_tv_bot.session"

    if action == "decrypt":
        encrypted_content_from_secret = os.environ.get('TELETHON_SESSION_ENC_CONTENT')
        if not encrypted_content_from_secret:
            print("TELETHON_SESSION_ENC_CONTENT environment variable not set for decryption.")
            exit(1)
        decrypt_session(encrypted_content_from_secret, session_file)
    elif action == "encrypt":
        encrypted_result = encrypt_session(session_file)
        # Print the encrypted content so it can be captured by the workflow
        # Using ::set-output is deprecated, but common for older actions.
        # For newer actions, it's better to write to a file and read it.
        # For simplicity here, we'll use set-output for now.
        print(f"::set-output name=encrypted_session::{encrypted_result}")
    else:
        print("Invalid ACTION. Use 'decrypt' or 'encrypt'.")
        exit(1)
