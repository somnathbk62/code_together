import React from "react";

const ErrorMessage = ({ message, onRetry, onClose }) => {
  return (
    <div className="error-message">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <div className="error-text">{message}</div>
        <div className="error-actions">
          {onRetry && (
            <button className="error-retry" onClick={onRetry}>
              Try Again
            </button>
          )}
          {onClose && (
            <button className="error-close" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
