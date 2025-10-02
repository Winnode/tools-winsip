import { useState, useEffect } from 'react'
import './ErrorModal.css'

const ErrorModal = ({ isOpen, onClose, title, message, details }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300) // Wait for animation
  }

  if (!isOpen) return null

  return (
    <div className={`error-modal-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`error-modal ${isVisible ? 'visible' : ''}`}>
        <div className="error-modal-header">
          <div className="error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#EF4444"/>
              <line x1="15" y1="9" x2="9" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="9" y1="9" x2="15" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2>{title}</h2>
          <button className="close-btn" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="error-modal-body">
          <p className="error-message">{message}</p>
          
          {details && (
            <div className="error-details">
              <label>Error Details:</label>
              <code className="error-code">{details}</code>
            </div>
          )}
        </div>

        <div className="error-modal-footer">
          <button className="retry-btn" onClick={handleClose}>
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorModal