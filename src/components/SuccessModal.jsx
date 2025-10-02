import { useState, useEffect } from 'react'
import './SuccessModal.css'

const SuccessModal = ({ isOpen, onClose, title, message, txHash }) => {
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

  const copyTxHash = () => {
    navigator.clipboard.writeText(txHash)
    // Could add a toast notification here
  }

  const openExplorer = () => {
    // This would need chain-specific explorer URL
    window.open(`https://explorer.example.com/tx/${txHash}`, '_blank')
  }

  if (!isOpen) return null

  return (
    <div className={`success-modal-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`success-modal ${isVisible ? 'visible' : ''}`}>
        <div className="success-modal-header">
          <div className="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#10B981"/>
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2>{title}</h2>
          <button className="close-btn" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="success-modal-body">
          <p className="success-message">{message}</p>
          
          {txHash && (
            <div className="tx-hash-section">
              <label>Transaction Hash:</label>
              <div className="tx-hash-container">
                <code className="tx-hash">{txHash}</code>
                <div className="tx-actions">
                  <button 
                    className="copy-btn" 
                    onClick={copyTxHash}
                    title="Copy transaction hash"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                  </button>
                  <button 
                    className="explorer-btn" 
                    onClick={openExplorer}
                    title="View in explorer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <polyline points="15,3 21,3 21,9" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="success-modal-footer">
          <button className="ok-btn" onClick={handleClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export default SuccessModal