from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from database import Base

class Server(Base):
    __tablename__ = "servers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    docker_host_url = Column(String, nullable=False, default="unix:///var/run/docker.sock")
    is_default = Column(Boolean, default=True)

    projects = relationship("Project", back_populates="server")