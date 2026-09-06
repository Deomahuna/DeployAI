import os
import uuid
from fastapi import UploadFile
from storage.base import StorageBackend

UPLOAD_DIR = "static/uploads"

class LocalStorage(StorageBackend):
    def save(self, file: UploadFile, folder: str) -> str:
        subfolder = os.path.join(UPLOAD_DIR, folder)
        os.makedirs(subfolder, exist_ok=True)

        ext = os.path.splitext(file.filename)[1]
        filename = f"{uuid.uuid4().hex}{ext}"
        path = os.path.join(subfolder, filename)

        with open(path, "wb") as f:
            f.write(file.file.read())

        return f"/static/uploads/{folder}/{filename}"

    def delete(self, file_url: str) -> None:
        relative_path = file_url.lstrip("/")
        if os.path.exists(relative_path):
            os.remove(relative_path)