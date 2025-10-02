import { useState, useEffect } from 'react'
import './StakeModal.css'

// Keybase Avatar Component
const KeybaseAvatar = ({ identity, moniker }) => {
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!identity) {
      setLoading(false)
      return
    }

    const fetchKeybaseAvatar = async () => {
      try {
        // Try multiple Keybase API endpoints
        const endpoints = [
          `https://keybase.io/_/api/1.0/user/lookup.json?key_suffix=${identity}&fields=pictures`,
          `https://keybase.io/_/api/1.0/user/lookup.json?username=${identity}&fields=pictures`,
          `https://keybase.io/_/api/1.0/user/lookup.json?key_fingerprint=${identity}&fields=pictures`
        ]

        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint)
            const data = await response.json()
            
            if (data.them && data.them.length > 0) {
              const user = data.them[0]
              if (user.pictures && user.pictures.primary) {
                setAvatarUrl(user.pictures.primary.url)
                setLoading(false)
                return
              }
            }
          } catch (err) {
            console.log(`Keybase endpoint failed: ${endpoint}`, err)
          }
        }
        
        setLoading(false)
      } catch (error) {
        console.log('Keybase fetch error:', error)
        setLoading(false)
      }
    }

    fetchKeybaseAvatar()
  }, [identity])

  if (loading) {
    return (
      <div className="validator-avatar loading">
        <div className="avatar-placeholder">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (avatarUrl) {
    return (
      <div className="validator-avatar">
        <img 
          src={avatarUrl} 
          alt={`${moniker} avatar`}
          className="avatar-img"
          onError={() => setAvatarUrl('')}
        />
      </div>
    )
  }

  // Fallback to moniker initial
  const initial = moniker ? moniker.charAt(0).toUpperCase() : 'V'
  return (
    <div className="validator-avatar fallback">
      <div className="avatar-initial">{initial}</div>
    </div>
  )
}

const StakeModal = ({ 
  isOpen, 
  onClose, 
  validator, 
  modalType, 
  stakedAmount, 
  rewards, 
  walletAddress, 
  chainConfig, 
  walletBalance, 
  validators,
  onTypeChange 
}) => {
  const [amount, setAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [selectedValidator, setSelectedValidator] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen || !validator) return null

  const [txHash, setTxHash] = useState('')
  const [txStatus, setTxStatus] = useState('') // 'success', 'error', 'pending'
  const [errorMessage, setErrorMessage] = useState('')

  // Input validation
  const validateInputs = () => {
    switch (modalType) {
      case 'delegate':
        if (!amount || parseFloat(amount) <= 0) {
          throw new Error('Jumlah delegate harus lebih dari 0')
        }
        if (parseFloat(amount) > walletBalance) {
          throw new Error('Saldo tidak mencukupi untuk delegate')
        }
        break
        
      case 'unbond':
        if (!amount || parseFloat(amount) <= 0) {
          throw new Error('Jumlah unbond harus lebih dari 0')
        }
        if (parseFloat(amount) > stakedAmount) {
          throw new Error('Jumlah unbond melebihi stake yang tersedia')
        }
        break
        
      case 'redelegate':
        if (!amount || parseFloat(amount) <= 0) {
          throw new Error('Jumlah redelegate harus lebih dari 0')
        }
        if (parseFloat(amount) > stakedAmount) {
          throw new Error('Jumlah redelegate melebihi stake yang tersedia')
        }
        if (!selectedValidator) {
          throw new Error('Pilih validator tujuan untuk redelegate')
        }
        if (selectedValidator === validator.operatorAddress) {
          throw new Error('Tidak bisa redelegate ke validator yang sama')
        }
        break
        
      case 'send':
        if (!amount || parseFloat(amount) <= 0) {
          throw new Error('Jumlah transfer harus lebih dari 0')
        }
        if (parseFloat(amount) > walletBalance) {
          throw new Error('Saldo tidak mencukupi untuk transfer')
        }
        if (!recipientAddress) {
          throw new Error('Masukkan alamat penerima')
        }
        if (recipientAddress === walletAddress) {
          throw new Error('Tidak bisa transfer ke alamat sendiri')
        }
        // Basic address validation
        if (!recipientAddress.startsWith(chainConfig.bech32Config.bech32PrefixAccAddr)) {
          throw new Error(`Alamat harus dimulai dengan ${chainConfig.bech32Config.bech32PrefixAccAddr}`)
        }
        break
        
      case 'claim':
        if (!rewards || rewards <= 0) {
          throw new Error('Tidak ada reward untuk diklaim')
        }
        break
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setTxStatus('pending')
    setErrorMessage('')
    setTxHash('')
    
    try {
      // Validate inputs first
      validateInputs()
      
      if (!window.keplr) {
        throw new Error('Keplr wallet belum terinstall')
      }

      // Enable the chain
      await window.keplr.enable(chainConfig.chainId)
      const offlineSigner = window.keplr.getOfflineSigner(chainConfig.chainId)
      const accounts = await offlineSigner.getAccounts()
      
      if (accounts[0].address !== walletAddress) {
        throw new Error('Alamat wallet tidak cocok, silakan reconnect wallet')
      }

      // Import Cosmos SDK modules
      const { SigningStargateClient } = await import('@cosmjs/stargate')
      const { coins } = await import('@cosmjs/amino')

      // Create signing client
      const client = await SigningStargateClient.connectWithSigner(
        chainConfig.rpc, 
        offlineSigner
      )

      let result
      // Dynamic fee calculation based on transaction type
      const getFee = (type) => {
        const baseFee = {
          delegate: { amount: '10000', gas: '250000' },
          unbond: { amount: '10000', gas: '250000' },
          redelegate: { amount: '15000', gas: '350000' },
          send: { amount: '5000', gas: '150000' },
          claim: { amount: '8000', gas: '200000' }
        }
        
        const feeConfig = baseFee[type] || baseFee.delegate
        return {
          amount: coins(feeConfig.amount, chainConfig.stakeCurrency.coinMinimalDenom),
          gas: feeConfig.gas,
        }
      }
      
      const fee = getFee(modalType)

      switch (modalType) {
        case 'delegate':
          // Additional confirmation for large amounts
          if (parseFloat(amount) > walletBalance * 0.5) {
            const confirm = window.confirm(
              `Anda akan delegate ${amount} ${chainConfig.stakeCurrency.coinDenom} (${((parseFloat(amount) / walletBalance) * 100).toFixed(1)}% dari saldo). Lanjutkan?`
            )
            if (!confirm) {
              throw new Error('Transaksi dibatalkan oleh user')
            }
          }
          
          const delegateAmount = {
            denom: chainConfig.stakeCurrency.coinMinimalDenom,
            amount: Math.floor(parseFloat(amount) * Math.pow(10, chainConfig.stakeCurrency.coinDecimals)).toString()
          }
          
          result = await client.delegateTokens(
            walletAddress,
            validator.operatorAddress,
            delegateAmount,
            fee,
            `Delegate ${amount} ${chainConfig.stakeCurrency.coinDenom} to ${validator.moniker}`
          )
          break

        case 'unbond':
          // Confirmation with unbonding period warning
          const confirmUnbond = window.confirm(
            `PERHATIAN: Unbond ${amount} ${chainConfig.stakeCurrency.coinDenom} akan mengunci token selama 21 hari dan tidak mendapat reward selama periode tersebut. Yakin ingin melanjutkan?`
          )
          if (!confirmUnbond) {
            throw new Error('Transaksi dibatalkan oleh user')
          }
          
          const unbondAmount = {
            denom: chainConfig.stakeCurrency.coinMinimalDenom,
            amount: Math.floor(parseFloat(amount) * Math.pow(10, chainConfig.stakeCurrency.coinDecimals)).toString()
          }
          
          result = await client.undelegateTokens(
            walletAddress,
            validator.operatorAddress,
            unbondAmount,
            fee,
            `Unbond ${amount} ${chainConfig.stakeCurrency.coinDenom} from ${validator.moniker}`
          )
          break

        case 'redelegate':
          if (!amount || parseFloat(amount) <= 0) {
            throw new Error('Please enter a valid amount to redelegate')
          }
          if (!selectedValidator) {
            throw new Error('Please select a destination validator')
          }
          
          const redelegateAmount = {
            denom: chainConfig.stakeCurrency.coinMinimalDenom,
            amount: Math.floor(parseFloat(amount) * Math.pow(10, chainConfig.stakeCurrency.coinDecimals)).toString()
          }
          
          const redelegateMsg = {
            typeUrl: '/cosmos.staking.v1beta1.MsgBeginRedelegate',
            value: {
              delegatorAddress: walletAddress,
              validatorSrcAddress: validator.operatorAddress,
              validatorDstAddress: selectedValidator,
              amount: redelegateAmount
            }
          }
          
          result = await client.signAndBroadcast(
            walletAddress,
            [redelegateMsg],
            fee,
            `Redelegate ${amount} ${chainConfig.stakeCurrency.coinDenom}`
          )
          break

        case 'send':
          if (!amount || parseFloat(amount) <= 0) {
            throw new Error('Please enter a valid amount to send')
          }
          if (!recipientAddress) {
            throw new Error('Please enter a recipient address')
          }
          
          const sendAmount = coins(
            Math.floor(parseFloat(amount) * Math.pow(10, chainConfig.stakeCurrency.coinDecimals)),
            chainConfig.stakeCurrency.coinMinimalDenom
          )
          
          result = await client.sendTokens(
            walletAddress,
            recipientAddress,
            sendAmount,
            fee,
            `Send ${amount} ${chainConfig.stakeCurrency.coinDenom}`
          )
          break

        case 'claim':
          const claimMsg = {
            typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
            value: {
              delegatorAddress: walletAddress,
              validatorAddress: validator.operatorAddress
            }
          }
          
          result = await client.signAndBroadcast(
            walletAddress,
            [claimMsg],
            fee,
            `Claim rewards from ${validator.moniker}`
          )
          break

        default:
          throw new Error('Unknown transaction type')
      }

      if (result.code === 0) {
        setTxHash(result.transactionHash)
        setTxStatus('success')
        
        // Show success message with transaction details
        console.log(`${modalType} berhasil:`, {
          hash: result.transactionHash,
          height: result.height,
          gasUsed: result.gasUsed,
          gasWanted: result.gasWanted
        })
        
        // Auto close modal after 5 seconds
        setTimeout(() => {
          onClose()
          // Refresh page data if needed
          window.location.reload()
        }, 5000)
      } else {
        throw new Error(`Transaksi gagal: ${result.rawLog || 'Unknown error'}`)
      }
      
    } catch (error) {
      console.error(`${modalType} error:`, error)
      setTxStatus('error')
      
      // User-friendly error messages
      let friendlyMessage = error.message
      
      if (error.message.includes('insufficient funds')) {
        friendlyMessage = 'Saldo tidak mencukupi untuk transaksi ini'
      } else if (error.message.includes('account sequence mismatch')) {
        friendlyMessage = 'Kesalahan urutan transaksi, silakan coba lagi'
      } else if (error.message.includes('invalid address')) {
        friendlyMessage = 'Alamat tidak valid'
      } else if (error.message.includes('Request rejected')) {
        friendlyMessage = 'Transaksi dibatalkan oleh user'
      } else if (error.message.includes('network')) {
        friendlyMessage = 'Koneksi jaringan bermasalah, silakan coba lagi'
      }
      
      setErrorMessage(friendlyMessage)
    } finally {
      setLoading(false)
    }
  }

  const renderModalContent = () => {
    switch (modalType) {
      case 'delegate':
        return (
          <div className="modal-content">
            <h3>Delegate to {validator.moniker}</h3>
            
            {txStatus === 'success' && (
              <div className="success-message">
                ✅ Transaksi berhasil!<br/>
                <small>Hash: <a href={`${chainConfig.explorer}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{color: '#00FF88'}}>{txHash.substring(0, 16)}...</a></small><br/>
                <small>Modal akan tertutup otomatis dalam 5 detik</small>
              </div>
            )}
            
            {txStatus === 'error' && (
              <div className="error-message">
                ❌ {errorMessage}
              </div>
            )}
            <div className="validator-info">
              <div className="validator-header-info">
                <KeybaseAvatar identity={validator.identity} moniker={validator.moniker} />
                <div className="validator-main-info">
                  <div className="validator-name">{validator.moniker}</div>
                  <div className="validator-details">
                    <div className="validator-detail-item">
                      <span className="validator-detail-label">Commission</span>
                      <span className="validator-detail-value">{validator.commission}%</span>
                    </div>
                    <div className="validator-detail-item">
                      <span className="validator-detail-label">Voting Power</span>
                      <span className="validator-detail-value">{validator.votingPower?.toLocaleString()} {chainConfig?.stakeCurrency.coinDenom}</span>
                    </div>
                    <div className="validator-detail-item">
                      <span className="validator-detail-label">Rank</span>
                      <span className="validator-detail-value">#{validator.rank}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label>Amount to Delegate</label>
              <div className="input-group">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.000001"
                />
                <span className="currency">{chainConfig?.stakeCurrency.coinDenom}</span>
              </div>
              <div className="balance-info">
                Available: {walletBalance?.toFixed(6)} {chainConfig?.stakeCurrency.coinDenom}
              </div>
            </div>

            <div className="quick-amounts">
              <button type="button" onClick={() => setAmount((walletBalance * 0.25).toString())}>25%</button>
              <button type="button" onClick={() => setAmount((walletBalance * 0.5).toString())}>50%</button>
              <button type="button" onClick={() => setAmount((walletBalance * 0.75).toString())}>75%</button>
              <button type="button" onClick={() => setAmount((walletBalance * 0.95).toString())}>Max</button>
            </div>
          </div>
        )

      case 'unbond':
        return (
          <div className="modal-content">
            <h3>Unbond from {validator.moniker}</h3>
            
            {txStatus === 'success' && (
              <div className="success-message">
                ✅ Unbonding initiated!<br/>
                <small>Hash: {txHash}</small><br/>
                <small>Tokens will be available in 21 days</small>
              </div>
            )}
            
            {txStatus === 'error' && (
              <div className="error-message">
                ❌ {errorMessage}
              </div>
            )}
            <div className="validator-info">
              <div className="validator-header-info">
                <KeybaseAvatar identity={validator.identity} moniker={validator.moniker} />
                <div className="validator-main-info">
                  <div className="validator-name">{validator.moniker}</div>
                  <div className="validator-details">
                    <div className="validator-detail-item">
                      <span className="validator-detail-label">Currently Staked</span>
                      <span className="validator-detail-value">{stakedAmount?.toFixed(6)} {chainConfig?.stakeCurrency.coinDenom}</span>
                    </div>
                    <div className="validator-detail-item">
                      <span className="validator-detail-label">Pending Rewards</span>
                      <span className="validator-detail-value">{rewards?.toFixed(6)} {chainConfig?.stakeCurrency.coinDenom}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="warning-box">
              <p>⚠️ <strong>Unbonding Period:</strong> 21 days</p>
              <p>Your tokens will be locked for 21 days after unbonding and won't earn rewards during this period.</p>
            </div>

            <div className="form-group">
              <label>Amount to Unbond</label>
              <div className="input-group">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  max={stakedAmount}
                  step="0.000001"
                />
                <span className="currency">{chainConfig?.stakeCurrency.coinDenom}</span>
              </div>
              <div className="balance-info">
                Staked: {stakedAmount?.toFixed(6)} {chainConfig?.stakeCurrency.coinDenom}
              </div>
            </div>

            <div className="quick-amounts">
              <button type="button" onClick={() => setAmount((stakedAmount * 0.25).toString())}>25%</button>
              <button type="button" onClick={() => setAmount((stakedAmount * 0.5).toString())}>50%</button>
              <button type="button" onClick={() => setAmount((stakedAmount * 0.75).toString())}>75%</button>
              <button type="button" onClick={() => setAmount(stakedAmount?.toString())}>All</button>
            </div>
          </div>
        )

      case 'redelegate':
        return (
          <div className="modal-content">
            <h3>Redelegate from {validator.moniker}</h3>
            
            {txStatus === 'success' && (
              <div className="success-message">
                ✅ Redelegation successful!<br/>
                <small>Hash: {txHash}</small>
              </div>
            )}
            
            {txStatus === 'error' && (
              <div className="error-message">
                ❌ {errorMessage}
              </div>
            )}
            <div className="validator-info">
              <div className="validator-header-info">
                <KeybaseAvatar identity={validator.identity} moniker={validator.moniker} />
                <div className="validator-main-info">
                  <div className="validator-name">{validator.moniker}</div>
                  <div className="validator-details">
                    <div className="validator-detail-item">
                      <span className="validator-detail-label">Currently Staked</span>
                      <span className="validator-detail-value">{stakedAmount?.toFixed(6)} {chainConfig?.stakeCurrency.coinDenom}</span>
                    </div>
                    <div className="validator-detail-item">
                      <span className="validator-detail-label">Commission</span>
                      <span className="validator-detail-value">{validator.commission}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Select New Validator</label>
              <select
                value={selectedValidator}
                onChange={(e) => setSelectedValidator(e.target.value)}
                className="validator-select"
              >
                <option value="">Choose validator...</option>
                {validators?.filter(v => v.operatorAddress !== validator.operatorAddress).map(v => (
                  <option key={v.operatorAddress} value={v.operatorAddress}>
                    {v.moniker} ({v.commission}% commission)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Amount to Redelegate</label>
              <div className="input-group">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  max={stakedAmount}
                  step="0.000001"
                />
                <span className="currency">{chainConfig?.stakeCurrency.coinDenom}</span>
              </div>
              <div className="balance-info">
                Staked: {stakedAmount?.toFixed(6)} {chainConfig?.stakeCurrency.coinDenom}
              </div>
            </div>

            <div className="quick-amounts">
              <button type="button" onClick={() => setAmount((stakedAmount * 0.25).toString())}>25%</button>
              <button type="button" onClick={() => setAmount((stakedAmount * 0.5).toString())}>50%</button>
              <button type="button" onClick={() => setAmount((stakedAmount * 0.75).toString())}>75%</button>
              <button type="button" onClick={() => setAmount(stakedAmount?.toString())}>All</button>
            </div>
          </div>
        )

      case 'send':
        return (
          <div className="modal-content">
            <h3>Send {chainConfig?.stakeCurrency.coinDenom}</h3>
            
            {txStatus === 'success' && (
              <div className="success-message">
                ✅ Transfer successful!<br/>
                <small>Hash: {txHash}</small>
              </div>
            )}
            
            {txStatus === 'error' && (
              <div className="error-message">
                ❌ {errorMessage}
              </div>
            )}
            
            <div className="form-group">
              <label>Recipient Address</label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="Enter recipient address..."
                className="address-input"
              />
            </div>

            <div className="form-group">
              <label>Amount to Send</label>
              <div className="input-group">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  max={walletBalance}
                  step="0.000001"
                />
                <span className="currency">{chainConfig?.stakeCurrency.coinDenom}</span>
              </div>
              <div className="balance-info">
                Available: {walletBalance?.toFixed(6)} {chainConfig?.stakeCurrency.coinDenom}
              </div>
            </div>

            <div className="quick-amounts">
              <button type="button" onClick={() => setAmount((walletBalance * 0.25).toString())}>25%</button>
              <button type="button" onClick={() => setAmount((walletBalance * 0.5).toString())}>50%</button>
              <button type="button" onClick={() => setAmount((walletBalance * 0.75).toString())}>75%</button>
              <button type="button" onClick={() => setAmount((walletBalance * 0.95).toString())}>Max</button>
            </div>

            <div className="info-box">
              <p>💡 <strong>Transaction Fee:</strong> ~0.01 {chainConfig?.stakeCurrency.coinDenom}</p>
            </div>
          </div>
        )

      case 'claim':
        return (
          <div className="modal-content">
            <h3>Claim Rewards from {validator.moniker}</h3>
            
            {txStatus === 'success' && (
              <div className="success-message">
                ✅ Rewards claimed successfully!<br/>
                <small>Hash: {txHash}</small>
              </div>
            )}
            
            {txStatus === 'error' && (
              <div className="error-message">
                ❌ {errorMessage}
              </div>
            )}
            <div className="rewards-info">
              <div className="reward-amount">
                <span className="amount">{rewards?.toFixed(6)}</span>
                <span className="currency">{chainConfig?.stakeCurrency.coinDenom}</span>
              </div>
              <p>Available rewards to claim</p>
            </div>

            <div className="info-box">
              <p>💡 Claiming rewards will automatically compound them if you re-stake.</p>
              <p>🔄 Consider setting up auto-compound for better returns.</p>
            </div>
          </div>
        )

      default:
        return <div>Unknown action</div>
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-tabs">
            <button 
              className={modalType === 'delegate' ? 'active' : ''} 
              onClick={() => onTypeChange('delegate')}
            >
              Delegate
            </button>
            <button 
              className={modalType === 'unbond' ? 'active' : ''} 
              onClick={() => onTypeChange('unbond')}
            >
              Unbond
            </button>
            <button 
              className={modalType === 'redelegate' ? 'active' : ''} 
              onClick={() => onTypeChange('redelegate')}
            >
              Redelegate
            </button>
            <button 
              className={modalType === 'send' ? 'active' : ''} 
              onClick={() => onTypeChange('send')}
            >
              Send
            </button>
            <button 
              className={modalType === 'claim' ? 'active' : ''} 
              onClick={() => onTypeChange('claim')}
            >
              Claim
            </button>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {renderModalContent()}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button 
              type="submit" 
              className="confirm-btn" 
              disabled={loading || txStatus === 'success' || (!amount && modalType !== 'claim') || (modalType === 'send' && !recipientAddress) || (modalType === 'redelegate' && !selectedValidator)}
            >
              {loading && <span className="loading-spinner"></span>}
              {loading ? 'Processing...' : 
               txStatus === 'success' ? 'Success!' : 
               `Confirm ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StakeModal
