import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SUPPORTED_CHAINS, getAllChains } from '../chains/index.js'
import StakeModal from './StakeModal.jsx'
import KeybaseAvatar from './KeybaseAvatar.jsx'
import SuccessModal from './SuccessModal.jsx'
import ErrorModal from './ErrorModal.jsx'
import './ValidatorPage.css'

const ValidatorPage = () => {
  // Wallet states
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [walletBalance, setWalletBalance] = useState(0)
  const [currentChainConfig, setCurrentChainConfig] = useState(null)
  const [selectedChainKey, setSelectedChainKey] = useState('cosmos')
  
  // Validators states
  const [validators, setValidators] = useState([])
  const [loadingValidators, setLoadingValidators] = useState(false)
  const [selectedValidator, setSelectedValidator] = useState(null)
  const [activeValidators, setActiveValidators] = useState([])
  const [inactiveValidators, setInactiveValidators] = useState([])
  const [jailedValidators, setJailedValidators] = useState([])
  const [currentTab, setCurrentTab] = useState('active') // 'active', 'jailed', 'inactive'
  const [validatorSearchTerm, setValidatorSearchTerm] = useState('')
  
  // Modal states
  const [showStakeModal, setShowStakeModal] = useState(false)
  const [modalType, setModalType] = useState('delegate') // delegate, redelegate, claim
  const [stakedAmount, setStakedAmount] = useState(0)
  const [rewards, setRewards] = useState(0)
  const [validatorsPerPage] = useState(50)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Success Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successData, setSuccessData] = useState({
    title: '',
    message: '',
    txHash: ''
  })
  
  // Error Modal states
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorData, setErrorData] = useState({
    title: '',
    message: '',
    details: ''
  })
  
  // Available chains
  const availableChains = getAllChains()
  
  // Debug: Log available chains on component mount
  useEffect(() => {
    console.log('🔗 Available chains:', Object.keys(SUPPORTED_CHAINS))
    console.log('📋 All chains config:', availableChains)
  }, [])

  // Keplr Wallet Functions
  const connectKeplr = async (chainKey = selectedChainKey) => {
    if (!window.keplr) {
      alert('Please install Keplr extension')
      return
    }

    try {
      const chainConfig = SUPPORTED_CHAINS[chainKey]
      if (!chainConfig) {
        throw new Error('Chain configuration not found')
      }

      await window.keplr.experimentalSuggestChain({
        chainId: chainConfig.chainId,
        chainName: chainConfig.chainName,
        rpc: chainConfig.rpc,
        rest: chainConfig.rest,
        bip44: chainConfig.bip44,
        bech32Config: chainConfig.bech32Config,
        currencies: chainConfig.currencies,
        feeCurrencies: chainConfig.feeCurrencies,
        stakeCurrency: chainConfig.stakeCurrency,
        features: chainConfig.features || []
      })

      await window.keplr.enable(chainConfig.chainId)
      const offlineSigner = window.keplr.getOfflineSigner(chainConfig.chainId)
      const accounts = await offlineSigner.getAccounts()
      
      setWalletAddress(accounts[0].address)
      setWalletConnected(true)
      setCurrentChainConfig(chainConfig)
      
      // Fetch balance
      await fetchBalance(accounts[0].address, chainConfig)
      
      // Ensure validators are loaded after wallet connection
      if (activeValidators.length === 0) {
        await fetchValidators(chainConfig)
      }
      
      console.log('Wallet connected:', accounts[0].address)
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      alert('Failed to connect wallet: ' + error.message)
    }
  }

  const disconnectWallet = () => {
    setWalletConnected(false)
    setWalletAddress('')
    setWalletBalance(0)
    setCurrentChainConfig(null)
  }

  const fetchBalance = async (address, chainConfig) => {
    try {
      // Try direct API call first
      let response = await fetch(`${chainConfig.rest}/cosmos/bank/v1beta1/balances/${address}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      // If CORS error, try alternative endpoints
      if (!response.ok) {
        console.log(`Primary API failed (${response.status}), trying alternative...`)
        
        // Try with /bank/balances endpoint (some chains use this)
        const altResponse = await fetch(`${chainConfig.rest}/bank/balances/${address}`)
        if (altResponse.ok) {
          response = altResponse
        } else {
          console.log('Alternative API also failed')
          // Set a mock balance for demo purposes
          setWalletBalance(100.123456)
          return
        }
      }
      
      const data = await response.json()
      
      if (data.balances && data.balances.length > 0) {
        const balance = data.balances.find(b => b.denom === chainConfig.stakeCurrency.coinMinimalDenom)
        
        if (balance) {
          const amount = parseFloat(balance.amount) / Math.pow(10, chainConfig.stakeCurrency.coinDecimals)
          setWalletBalance(amount)
        } else {
          setWalletBalance(0)
        }
      } else {
        // If no balances, set to 0
        setWalletBalance(0)
      }
    } catch (error) {
      console.log('Balance fetch error:', error.message)
      // Set to 0 when API fails
      setWalletBalance(0)
    }
  }

  // Validators Functions
  const fetchValidators = async (chainConfig) => {
    if (!chainConfig) {
      console.error('❌ No chain config provided to fetchValidators')
      return
    }
    
    console.log('🚀 Starting validator fetch for:', chainConfig.chainName)
    setLoadingValidators(true)
    setValidators([])
    setActiveValidators([])
    setInactiveValidators([])
    
    try {
      const apiUrl = `${chainConfig.rest}/cosmos/staking/v1beta1/validators?pagination.limit=200`
      console.log('📡 Fetching from URL:', apiUrl)
      
      const response = await fetch(apiUrl)
      console.log('📊 Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('📋 Received validator data:', data.validators?.length, 'validators')
      
      const processedValidators = data.validators?.map((validator, index) => {
        const tokens = parseInt(validator.tokens || '0')
        const votingPower = tokens / Math.pow(10, chainConfig.stakeCurrency.coinDecimals)
        const commission = parseFloat(validator.commission?.commission_rates?.rate || '0') * 100
        
        // Properly determine validator status
        let status = 'Inactive'
        if (validator.status === 'BOND_STATUS_BONDED' && !validator.jailed) {
          status = 'Active'
        } else if (validator.jailed) {
          status = 'Jailed'
        } else if (validator.status === 'BOND_STATUS_UNBONDING') {
          status = 'Unbonding'
        } else if (validator.status === 'BOND_STATUS_UNBONDED') {
          status = 'Unbonded'
        }
        
        return {
          operatorAddress: validator.operator_address,
          moniker: validator.description?.moniker || `Validator ${index + 1}`,
          identity: validator.description?.identity || '',
          website: validator.description?.website || '',
          details: validator.description?.details || '',
          votingPower: votingPower,
          tokens: tokens,
          commission: commission.toFixed(2),
          status: status,
          jailed: validator.jailed,
          rank: index + 1
        }
      }) || []
      
      // Sort by voting power (active validators first, then by voting power)
      processedValidators.sort((a, b) => {
        if (a.status === 'Active' && b.status !== 'Active') return -1
        if (a.status !== 'Active' && b.status === 'Active') return 1
        return b.votingPower - a.votingPower
      })
      
      // Separate validators by status
      const activeVals = processedValidators.filter(v => v.status === 'Active')
      const jailedVals = processedValidators.filter(v => v.status === 'Jailed')
      const inactiveVals = processedValidators.filter(v => v.status !== 'Active' && v.status !== 'Jailed')
      
      // Assign ranks separately for each category
      activeVals.forEach((validator, index) => {
        validator.rank = index + 1
      })
      
      jailedVals.forEach((validator, index) => {
        validator.rank = index + 1
      })
      
      inactiveVals.forEach((validator, index) => {
        validator.rank = activeVals.length + index + 1
      })
      
      setValidators(processedValidators)
      setActiveValidators(activeVals)
      setJailedValidators(jailedVals)
      setInactiveValidators(inactiveVals)
      
    } catch (error) {
      console.error('❌ Error fetching validators:', error.message)
      console.error('🔧 Full error:', error)
      
      // Try alternative endpoint format
      try {
        console.log('🔄 Trying alternative endpoint...')
        const altUrl = `${chainConfig.rest}/staking/validators`
        const altResponse = await fetch(altUrl)
        
        if (altResponse.ok) {
          const altData = await altResponse.json()
          console.log('✅ Alternative endpoint worked:', altData.result?.length || 0, 'validators')
          
          if (altData.result && altData.result.length > 0) {
            // Process alternative format if it exists
            const processedValidators = altData.result.map((validator, index) => ({
              operatorAddress: validator.operator_address || validator.address,
              moniker: validator.description?.moniker || `Validator ${index + 1}`,
              identity: validator.description?.identity || '',
              website: validator.description?.website || '',
              details: validator.description?.details || '',
              votingPower: parseInt(validator.tokens || '0') / Math.pow(10, 6),
              tokens: parseInt(validator.tokens || '0'),
              commission: parseFloat(validator.commission?.commission_rates?.rate || '0') * 100,
              status: validator.jailed ? 'Jailed' : 'Active',
              jailed: validator.jailed || false,
              rank: index + 1
            }))
            
            setValidators(processedValidators)
            setActiveValidators(processedValidators.filter(v => v.status === 'Active'))
            setInactiveValidators(processedValidators.filter(v => v.status !== 'Active'))
            return
          }
        }
      } catch (altError) {
        console.error('❌ Alternative endpoint also failed:', altError.message)
      }
      
      // Set empty arrays when all APIs fail
      setValidators([])
      setActiveValidators([])
      setInactiveValidators([])
    } finally {
      setLoadingValidators(false)
    }
  }

  const openStakeModal = (validator, type = 'delegate') => {
    setSelectedValidator(validator)
    setModalType(type)
    setShowStakeModal(true)
    
    // Fetch user's staked amount and rewards for this validator
    if (walletConnected && walletAddress) {
      fetchDelegationInfo(validator.operatorAddress)
    }
  }

  const executeUnjail = async (validator) => {
    if (!walletConnected) {
      alert('Please connect your wallet first')
      return
    }

    try {
      const { unjailOperation } = await import('/operations/unjail.js')
      const signer = await window.keplr.getOfflineSigner(currentChainConfig.chainId)
      
      const result = await unjailOperation.execute(currentChainConfig, signer, walletAddress, validator.operatorAddress)
      
      if (result.success) {
        setSuccessData({
          title: 'Validator Unjailed Successfully! 🎉',
          message: `Validator "${validator.moniker}" has been successfully unjailed and can now participate in consensus again.`,
          txHash: result.txHash
        })
        setShowSuccessModal(true)
        
        // Refresh validators list
        fetchValidators(currentChainConfig)
      }
    } catch (error) {
      console.error('Unjail error:', error)
      if (error.message.includes('Request rejected')) {
        setErrorData({
          title: 'Transaction Cancelled',
          message: 'You cancelled the transaction in Keplr wallet.',
          details: ''
        })
      } else {
        setErrorData({
          title: 'Unjail Failed',
          message: `Failed to unjail validator "${validator.moniker}". Please try again or check if you are the validator operator.`,
          details: error.message
        })
      }
      setShowErrorModal(true)
    }
  }

  const fetchDelegationInfo = async (validatorAddress) => {
    if (!currentChainConfig || !walletAddress) return
    
    try {
      // Fetch delegation
      const delResponse = await fetch(`${currentChainConfig.rest}/cosmos/staking/v1beta1/delegations/${walletAddress}/${validatorAddress}`)
      
      if (delResponse.ok) {
        const delData = await delResponse.json()
        const amount = parseFloat(delData.delegation_response?.balance?.amount || '0') / Math.pow(10, currentChainConfig.stakeCurrency.coinDecimals)
        setStakedAmount(amount)
      } else {
        setStakedAmount(0)
      }
      
      // Fetch rewards
      const rewardResponse = await fetch(`${currentChainConfig.rest}/cosmos/distribution/v1beta1/delegators/${walletAddress}/rewards/${validatorAddress}`)
      
      if (rewardResponse.ok) {
        const rewardData = await rewardResponse.json()
        const rewardAmount = parseFloat(rewardData.rewards?.[0]?.amount || '0') / Math.pow(10, currentChainConfig.stakeCurrency.coinDecimals)
        setRewards(rewardAmount)
      } else {
        setRewards(0)
      }
    } catch (error) {
      console.log('Error fetching delegation info:', error.message)
      setStakedAmount(0)
      setRewards(0)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString()
  }

  const handleChainChange = (chainKey) => {
    setSelectedChainKey(chainKey)
    const chainConfig = SUPPORTED_CHAINS[chainKey]
    setCurrentChainConfig(chainConfig)
    
    // Reset pagination
    setCurrentPage(1)
    
    // Reconnect wallet if already connected
    if (walletConnected) {
      connectKeplr(chainKey)
    }
    
    // Fetch validators for new chain
    fetchValidators(chainConfig)
  }

  // Load validators on component mount
  useEffect(() => {
    const chainConfig = SUPPORTED_CHAINS[selectedChainKey]
    console.log('🔍 Loading validators for chain:', selectedChainKey, chainConfig)
    setCurrentChainConfig(chainConfig)
    if (chainConfig) {
      console.log('📡 Fetching validators from:', chainConfig.rest)
      fetchValidators(chainConfig)
    } else {
      console.error('❌ Chain config not found for:', selectedChainKey)
    }
  }, [selectedChainKey])

  return (
    <div className="validator-page">
      <div className="validator-container">
        {/* Back Home Button */}
        <div className="back-home-section">
          <Link to="/" className="back-home-link">
            ← Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="validator-header">
          <div className="header-left">
            <div className="chain-logo">
              <div className="logo-container">
                {currentChainConfig?.logo ? (
                  <img 
                    src={currentChainConfig.logo} 
                    alt={currentChainConfig.chainName}
                    className="chain-logo-img"
                  />
                ) : (
                  <div className="logo-placeholder" style={{ background: currentChainConfig?.color || '#00D4FF' }}>
                    🔷
                  </div>
                )}
              </div>
              <div className="chain-info">
                <h1>{currentChainConfig?.chainName || 'Loading...'} <span className="mainnet-badge">Mainnet</span></h1>
                <p>A high-performance Cosmos blockchain for real-world assets.</p>
              </div>
            </div>
          </div>
          
          <div className="header-right">
            {/* Chain Selector */}
            <div className="chain-selector">
              <select 
                value={selectedChainKey} 
                onChange={(e) => handleChainChange(e.target.value)}
                className="chain-select"
              >
                {availableChains.map((chain) => (
                  <option key={chain.key} value={chain.key}>
                    {chain.chainName}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Wallet Connection */}
            <div className="wallet-section">
              {walletConnected ? (
                <div className="wallet-connected">
                  <div className="wallet-info">
                    <div className="wallet-address">{walletAddress.substring(0, 10)}...{walletAddress.substring(walletAddress.length - 6)}</div>
                    <div className="wallet-balance">
                      {walletBalance > 0 ? walletBalance.toFixed(6) : '0.000000'} {currentChainConfig?.stakeCurrency.coinDenom}
                    </div>
                  </div>
                  <button onClick={disconnectWallet} className="disconnect-btn">Disconnect</button>
                </div>
              ) : (
                <button onClick={() => connectKeplr()} className="connect-wallet-btn">
                  <span className="wallet-icon">👛</span>
                  <span className="wallet-text">Connect Wallet</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="validator-stats">
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-label">Staking APR</div>
            <div className="stat-value">172.66%</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-label">Active Validators</div>
            <div className="stat-value">{activeValidators.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-label">Total Supply</div>
            <div className="stat-value">1.2B LUME</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"></div>
            <div className="stat-label">Bonded Ratio</div>
            <div className="stat-value">68.5%</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔗</div>
            <div className="stat-label">Chain ID</div>
            <div className="stat-value">{currentChainConfig?.chainId}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🌐</div>
            <div className="stat-label">Explorer</div>
            <div className="stat-value">
              <a href={currentChainConfig?.explorer} target="_blank" rel="noopener noreferrer">
                View
              </a>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="validator-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search validator..."
              className="validator-search"
              value={validatorSearchTerm}
              onChange={(e) => setValidatorSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            className="refresh-btn"
            onClick={() => fetchValidators(currentChainConfig)}
            disabled={loadingValidators}
          >
            {loadingValidators ? '🔄' : '🔄'} Refresh
          </button>
          
          <button 
            className="refresh-btn"
            onClick={() => {
              // Add test validators for debugging
              const testValidators = [
                {
                  operatorAddress: 'cosmosvaloper1sjllsnramtg3ewxqwwrwjxfgc4n4ef9u2lcnj0',
                  moniker: 'Citadel.one',
                  identity: '',
                  website: '',
                  details: '',
                  votingPower: 1500000,
                  tokens: 1500000000000,
                  commission: 5.00,
                  status: 'Active',
                  jailed: false,
                  rank: 1
                },
                {
                  operatorAddress: 'cosmosvaloper1c4k24jzduc365kywrsvf5ujz4ya6mwympnc4en',
                  moniker: 'Coinbase Custody',
                  identity: '',
                  website: '',
                  details: '',
                  votingPower: 1200000,
                  tokens: 1200000000000,
                  commission: 8.00,
                  status: 'Active',
                  jailed: false,
                  rank: 2
                }
              ]
              setValidators(testValidators)
              setActiveValidators(testValidators)
              setInactiveValidators([])
              console.log('✅ Test validators loaded')
            }}
            style={{ marginLeft: '10px', background: '#00ff88' }}
          >
            🧪 Test Data
          </button>
        </div>

        {/* Tabs */}
        <div className="validator-tabs">
          <button 
            className={`validator-tab ${currentTab === 'active' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('active')
              setCurrentPage(1)
            }}
          >
            Active ({activeValidators.length})
          </button>
          <button 
            className={`validator-tab ${currentTab === 'inactive' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('inactive')
              setCurrentPage(1)
            }}
          >
            Inactive ({inactiveValidators.length})
          </button>
          <button 
            className={`validator-tab ${currentTab === 'jailed' ? 'active' : ''} jailed-tab`}
            onClick={() => {
              setCurrentTab('jailed')
              setCurrentPage(1)
            }}
          >
            Jailed ({jailedValidators.length})
          </button>
        </div>

        {/* Validators Table */}
        {(() => {
          const getCurrentValidators = () => {
            switch(currentTab) {
              case 'active': return activeValidators
              case 'jailed': return jailedValidators
              case 'inactive': return inactiveValidators
              default: return activeValidators
            }
          }

          return loadingValidators ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading validators...</p>
            </div>
          ) : (
            <div className="validator-table-container">
              <div className="validator-table-header">
                <div className="col-validator">Validator</div>
                <div className="col-voting-power">Voting Power</div>
                <div className="col-commission">Commission</div>
                <div className="col-staked">Staked Amount</div>
                <div className="col-action">Action</div>
              </div>
              
              <div className="validator-table-body">
                {(() => {
                  const filteredValidators = getCurrentValidators()
                    .filter(validator => 
                      validator.moniker.toLowerCase().includes(validatorSearchTerm.toLowerCase())
                    )
                
                const startIndex = (currentPage - 1) * validatorsPerPage
                const endIndex = startIndex + validatorsPerPage
                const paginatedValidators = filteredValidators.slice(startIndex, endIndex)
                
                return paginatedValidators.map((validator, index) => (
                <div key={validator.operatorAddress} className="validator-table-row">
                  <div className="col-validator">
                    <div className="validator-info">
                      <div className="validator-rank">#{validator.rank}</div>
                      <KeybaseAvatar 
                        identity={validator.identity} 
                        moniker={validator.moniker} 
                        size={36}
                      />
                      <div className="validator-details">
                        <div className="validator-name">{validator.moniker}</div>
                        <div className="validator-address" title={validator.operatorAddress}>
                          {validator.operatorAddress.substring(0, 20)}...
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-voting-power">
                    <div className="voting-power-main">
                      {formatNumber(validator.votingPower)} {currentChainConfig?.stakeCurrency.coinDenom}
                    </div>
                    <div className="voting-power-percentage">
                      {((validator.votingPower / 10000000) * 100).toFixed(2)}%
                    </div>
                  </div>
                  
                  <div className="col-commission">
                    {validator.commission}%
                  </div>
                  
                  <div className="col-staked">
                    {formatNumber(validator.votingPower)} {currentChainConfig?.stakeCurrency.coinDenom}
                  </div>
                  
                  <div className="col-action">
                    {validator.status === 'Jailed' ? (
                      <button 
                        className="unjail-btn"
                        onClick={() => executeUnjail(validator)}
                        disabled={!walletConnected}
                      >
                        Unjail
                      </button>
                    ) : (
                      <button 
                        className="delegate-btn"
                        onClick={() => openStakeModal(validator, 'delegate')}
                        disabled={!walletConnected}
                      >
                        Manage
                      </button>
                    )}
                  </div>
                </div>
                  ))
                })()}
              </div>
              
              {getCurrentValidators().length === 0 && (
                <div className="no-validators">
                  <p>No validators found</p>
                  <div style={{ margin: '20px 0', padding: '15px', background: '#1a1a1a', borderRadius: '8px' }}>
                    <p style={{ color: '#ffcc00', marginBottom: '10px' }}>Debug Info:</p>
                    <p style={{ color: '#aaa', fontSize: '14px' }}>Chain: {currentChainConfig?.chainName || 'Not loaded'}</p>
                    <p style={{ color: '#aaa', fontSize: '14px' }}>API: {currentChainConfig?.rest || 'Not available'}</p>
                    <p style={{ color: '#aaa', fontSize: '14px' }}>Total Validators: {validators.length}</p>
                    <p style={{ color: '#aaa', fontSize: '14px' }}>Active: {activeValidators.length} | Jailed: {jailedValidators.length} | Inactive: {inactiveValidators.length}</p>
                  </div>
                  <button onClick={() => fetchValidators(currentChainConfig)} className="retry-btn">
                    Try Again
                  </button>
                </div>
              )}
              
              {/* Pagination Controls */}
              {getCurrentValidators().length > validatorsPerPage && (
              <div className="pagination-controls">
                <button 
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </button>
                
                <div className="pagination-info">
                  Page {currentPage} of {Math.ceil(getCurrentValidators().length / validatorsPerPage)}
                  <span className="validator-count">
                    ({getCurrentValidators().length} validators)
                  </span>
                </div>
                
                <button 
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => 
                    Math.min(prev + 1, Math.ceil(getCurrentValidators().length / validatorsPerPage))
                  )}
                  disabled={currentPage >= Math.ceil(getCurrentValidators().length / validatorsPerPage)}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
          )
        })()}

        {/* Stake Modal */}
        {showStakeModal && (
          <StakeModal
            isOpen={showStakeModal}
            onClose={() => setShowStakeModal(false)}
            validator={selectedValidator}
            modalType={modalType}
            stakedAmount={stakedAmount}
            rewards={rewards}
            walletAddress={walletAddress}
            chainConfig={currentChainConfig}
            walletBalance={walletBalance}
            validators={activeValidators}
            onTypeChange={setModalType}
          />
        )}

        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title={successData.title}
          message={successData.message}
          txHash={successData.txHash}
        />

        {/* Error Modal */}
        <ErrorModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title={errorData.title}
          message={errorData.message}
          details={errorData.details}
        />
      </div>
    </div>
  )
}

export default ValidatorPage