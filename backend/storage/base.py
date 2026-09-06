from abc import ABC, abstractmethod
from fastapi import UploadFile

class StorageBackend(ABC):
    @abstractmethod
    def save(self, file: UploadFile, folder: str) -> str:
        """Sauvegarde le fichier, retourne l'URL publique d'accès."""
        ...

    @abstractmethod
    def delete(self, file_url: str) -> None:
        ...