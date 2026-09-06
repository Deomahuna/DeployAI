import os
from storage.local_storage import LocalStorage
# from storage.cloudinary_storage import CloudinaryStorage  # à décommenter plus tard

def get_storage():
    backend = os.getenv("STORAGE_BACKEND", "local")
    if backend == "local":
        return LocalStorage()
    # if backend == "cloudinary":
    #     return CloudinaryStorage()
    raise ValueError(f"Backend de stockage inconnu : {backend}")