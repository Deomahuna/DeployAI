from pydantic import BaseModel

class RepoOut(BaseModel):
    id: str
    name: str
    full_name: str
    private: bool
    updated_at: str
    imported: bool = False