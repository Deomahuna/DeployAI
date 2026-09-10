from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from database import Base


class Server(Base):
    __tablename__ = "servers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    docker_host_url = Column(String, nullable=False, default="unix:///var/run/docker.sock")
    # Adresse publique/joignable pour consulter les déploiements sur ce serveur
    # (peut différer de docker_host_url, ex: démon Docker sur une IP privée/VPN
    # alors que l'app doit être consultée via une IP publique ou un domaine).
    # Optionnel : si vide, on retombe sur le hostname déduit de docker_host_url.
    public_host = Column(String, nullable=True)
    is_default = Column(Boolean, default=True)

    projects = relationship("Project", back_populates="server")