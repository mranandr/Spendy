from typing import Any

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings


class TokenEncryption:
    def __init__(self, key: str):
        if not key:
            raise ValueError("BROKER_TOKEN_ENCRYPTION_KEY is required")
        self._fernet = Fernet(key.encode() if isinstance(key, str) else key)

    def encrypt(self, plaintext: str) -> str:
        return self._fernet.encrypt(plaintext.encode()).decode()

    def decrypt(self, ciphertext: str) -> str:
        try:
            return self._fernet.decrypt(ciphertext.encode()).decode()
        except InvalidToken as exc:
            raise ValueError("Failed to decrypt broker token") from exc


def get_encryptor() -> TokenEncryption | None:
    if not settings.broker_token_encryption_key:
        return None
    return TokenEncryption(settings.broker_token_encryption_key)
