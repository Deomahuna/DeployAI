import { FiCheckCircle, FiXCircle, FiInfo, FiX } from "react-icons/fi";
import "./Toast.css";

const icons = {
  success: FiCheckCircle,
  error: FiXCircle,
  info: FiInfo,
};

function Toast({ message, type = "info", onClose }) {
  const Icon = icons[type] || FiInfo;

  return (
    <div className={`toast toast-${type}`}>
      <Icon size={18} />
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Fermer">
        <FiX size={14} />
      </button>
    </div>
  );
}

export default Toast;