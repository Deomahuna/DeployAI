import enum

class ProjectStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"

class DeploymentStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"

class DiagnosticSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class BuildStrategy(str, enum.Enum):
    DOCKER_COMPOSE = "docker_compose"
    EXISTING_DOCKERFILE = "existing_dockerfile"
    GENERATED_NODE = "generated_node"
    GENERATED_NODE_STATIC = "generated_node_static"
    GENERATED_PYTHON = "generated_python"
    GENERATED_STATIC = "generated_static"
    MANUAL = "manual"
    UNDETECTED = "undetected"