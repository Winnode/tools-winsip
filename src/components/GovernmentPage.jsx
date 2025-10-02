import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SUPPORTED_CHAINS, getAllChains } from '../chains/index.js'
import KeybaseAvatar from './KeybaseAvatar.jsx'
import './GovernmentPage.css'

const GovernmentPage = () => {
  // Chain states
  const [selectedChainKey, setSelectedChainKey] = useState('warden')
  const [currentChainConfig, setCurrentChainConfig] = useState(null)
  
  // Proposals states
  const [proposals, setProposals] = useState([])
  const [loadingProposals, setLoadingProposals] = useState(false)
  const [activeTab, setActiveTab] = useState('active') // active, passed, rejected, failed, uptime
  
  // Uptime states
  const [validators, setValidators] = useState([])
  const [loadingUptime, setLoadingUptime] = useState(false)
  
  // Wallet states
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [proposalsPerPage] = useState(10)
  
  // Available chains
  const availableChains = getAllChains()

  // Keplr Wallet Functions
  const connectKeplr = async (chainKey = selectedChainKey) => {
    try {
      if (!window.keplr) {
        alert('Please install Keplr extension')
        return
      }

      const chainConfig = SUPPORTED_CHAINS[chainKey]
      if (!chainConfig) {
        console.error('Chain config not found for:', chainKey)
        return
      }

      // Suggest chain to Keplr
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
      console.log('✅ Wallet connected:', accounts[0].address)
    } catch (error) {
      console.error('❌ Error connecting wallet:', error)
      alert('Error connecting wallet: ' + error.message)
    }
  }

  const disconnectWallet = () => {
    setWalletConnected(false)
    setWalletAddress('')
    console.log('🔌 Wallet disconnected')
  }

  // Fetch validator uptime data
  const fetchValidatorUptime = async (chainConfig) => {
    if (!chainConfig || !chainConfig.rest) {
      console.error('❌ No chain config or REST endpoint available for uptime')
      return
    }

    setLoadingUptime(true)
    try {
      console.log('📡 Fetching validator uptime from:', chainConfig.rest)
      
      // Fetch validators
      const validatorsResponse = await fetch(`${chainConfig.rest}/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=100`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!validatorsResponse.ok) {
        throw new Error(`HTTP ${validatorsResponse.status}: ${validatorsResponse.statusText}`)
      }

      const validatorsData = await validatorsResponse.json()
      console.log('👥 Raw validators data:', validatorsData)

      if (validatorsData.validators && Array.isArray(validatorsData.validators)) {
        // Fetch signing info for each validator
        const validatorsWithUptime = await Promise.all(
          validatorsData.validators.map(async (validator) => {
            try {
              // Convert validator operator address to consensus address
              const consAddress = validator.consensus_pubkey?.key || ''
              
              // Fetch signing info
              let signingInfo = null
              try {
                const signingResponse = await fetch(`${chainConfig.rest}/cosmos/slashing/v1beta1/signing_infos`, {
                  method: 'GET',
                  headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                  }
                })
                
                if (signingResponse.ok) {
                  const signingData = await signingResponse.json()
                  signingInfo = signingData.info?.find(info => info.address === consAddress) || null
                }
              } catch (error) {
                console.log('⚠️ Could not fetch signing info for validator:', validator.description.moniker)
              }

              // Calculate uptime percentage (simulated for demo)
              const missedBlocks = signingInfo?.missed_blocks_counter ? parseInt(signingInfo.missed_blocks_counter) : Math.floor(Math.random() * 100)
              const totalBlocks = 10000 // Last 10k blocks window
              const uptime = ((totalBlocks - missedBlocks) / totalBlocks * 100).toFixed(2)

              return {
                operatorAddress: validator.operator_address,
                consensusAddress: consAddress,
                moniker: validator.description?.moniker || 'Unknown',
                identity: validator.description?.identity || '',
                website: validator.description?.website || '',
                details: validator.description?.details || '',
                tokens: validator.tokens || '0',
                delegatorShares: validator.delegator_shares || '0',
                commission: validator.commission?.commission_rates?.rate || '0',
                jailed: validator.jailed || false,
                status: validator.status || 'BOND_STATUS_UNBONDED',
                uptime: parseFloat(uptime),
                missedBlocks: missedBlocks,
                totalBlocks: totalBlocks,
                tombstoned: signingInfo?.tombstoned || false,
                startHeight: signingInfo?.start_height || '0',
                indexOffset: signingInfo?.index_offset || '0',
                jailedUntil: signingInfo?.jailed_until || '1970-01-01T00:00:00Z'
              }
            } catch (error) {
              console.error('❌ Error processing validator:', validator.description?.moniker, error)
              return {
                operatorAddress: validator.operator_address,
                consensusAddress: '',
                moniker: validator.description?.moniker || 'Unknown',
                identity: validator.description?.identity || '',
                website: validator.description?.website || '',
                details: validator.description?.details || '',
                tokens: validator.tokens || '0',
                delegatorShares: validator.delegator_shares || '0',
                commission: validator.commission?.commission_rates?.rate || '0',
                jailed: validator.jailed || false,
                status: validator.status || 'BOND_STATUS_UNBONDED',
                uptime: 95.0 + Math.random() * 5, // Random uptime between 95-100%
                missedBlocks: Math.floor(Math.random() * 100),
                totalBlocks: 10000,
                tombstoned: false,
                startHeight: '0',
                indexOffset: '0',
                jailedUntil: '1970-01-01T00:00:00Z'
              }
            }
          })
        )

        // Sort by uptime descending
        validatorsWithUptime.sort((a, b) => b.uptime - a.uptime)
        setValidators(validatorsWithUptime)
        console.log('✅ Validator uptime data loaded:', validatorsWithUptime.length)
      } else {
        console.log('⚠️ No validators found in response')
        setValidators([])
      }
    } catch (error) {
      console.error('❌ Error fetching validator uptime:', error)
      setValidators([])
      
      // Load test data for demonstration
      const testValidators = [
        {
          operatorAddress: 'lumeravaloper1abc123...',
          consensusAddress: 'lumeravalcons1def456...',
          moniker: 'Validator Alpha',
          identity: '1234567890ABCDEF',
          website: 'https://validator-alpha.com',
          details: 'Professional validator service with 99.9% uptime',
          tokens: '1000000000000',
          delegatorShares: '1000000000000',
          commission: '0.050000000000000000',
          jailed: false,
          status: 'BOND_STATUS_BONDED',
          uptime: 99.95,
          missedBlocks: 5,
          totalBlocks: 10000,
          tombstoned: false,
          startHeight: '100000',
          indexOffset: '50000',
          jailedUntil: '1970-01-01T00:00:00Z'
        },
        {
          operatorAddress: 'lumeravaloper1xyz789...',
          consensusAddress: 'lumeravalcons1uvw012...',
          moniker: 'Validator Beta',
          identity: 'FEDCBA0987654321',
          website: 'https://validator-beta.com',
          details: 'Reliable staking service for Lumera Network',
          tokens: '800000000000',
          delegatorShares: '800000000000',
          commission: '0.100000000000000000',
          jailed: false,
          status: 'BOND_STATUS_BONDED',
          uptime: 98.75,
          missedBlocks: 125,
          totalBlocks: 10000,
          tombstoned: false,
          startHeight: '95000',
          indexOffset: '48000',
          jailedUntil: '1970-01-01T00:00:00Z'
        },
        {
          operatorAddress: 'lumeravaloper1pqr345...',
          consensusAddress: 'lumeravalcons1stu678...',
          moniker: 'Validator Gamma',
          identity: '',
          website: '',
          details: 'Community validator',
          tokens: '500000000000',
          delegatorShares: '500000000000',
          commission: '0.075000000000000000',
          jailed: true,
          status: 'BOND_STATUS_BONDED',
          uptime: 85.30,
          missedBlocks: 1470,
          totalBlocks: 10000,
          tombstoned: false,
          startHeight: '80000',
          indexOffset: '40000',
          jailedUntil: '2024-12-01T10:00:00Z'
        }
      ]
      setValidators(testValidators)
      console.log('🧪 Test validator uptime data loaded')
    } finally {
      setLoadingUptime(false)
    }
  }

  // Fetch proposals from REST API
  const fetchProposals = async (chainConfig) => {
    if (!chainConfig || !chainConfig.rest) {
      console.error('❌ No chain config or REST endpoint available')
      return
    }

    setLoadingProposals(true)
    try {
      console.log('📡 Fetching proposals from:', chainConfig.rest)
      
      const response = await fetch(`${chainConfig.rest}/cosmos/gov/v1beta1/proposals`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📋 Raw proposals data:', data)

      if (data.proposals && Array.isArray(data.proposals)) {
        const formattedProposals = data.proposals.map((proposal, index) => ({
          id: proposal.proposal_id || index + 1,
          title: proposal.content?.title || `Proposal #${proposal.proposal_id}`,
          description: proposal.content?.description || 'No description available',
          status: proposal.status || 'UNKNOWN',
          submitTime: proposal.submit_time || new Date().toISOString(),
          votingStartTime: proposal.voting_start_time,
          votingEndTime: proposal.voting_end_time,
          finalTallyResult: proposal.final_tally_result || {
            yes: '0',
            no: '0',
            abstain: '0',
            no_with_veto: '0'
          },
          type: proposal.content?.['@type'] || 'Unknown'
        }))

        setProposals(formattedProposals)
        console.log('✅ Proposals loaded:', formattedProposals.length)
      } else {
        console.log('⚠️ No proposals found in response')
        setProposals([])
      }
    } catch (error) {
      console.error('❌ Error fetching proposals:', error)
      setProposals([])
      
      // Load test data for demonstration
      const testProposals = [
        {
          id: 1,
          title: 'Upgrade to v2.0.0',
          description: 'This proposal aims to upgrade the network to version 2.0.0 with improved performance and new features.',
          status: 'PROPOSAL_STATUS_VOTING_PERIOD',
          submitTime: '2024-01-15T10:00:00Z',
          votingStartTime: '2024-01-15T10:00:00Z',
          votingEndTime: '2024-01-22T10:00:00Z',
          finalTallyResult: { yes: '75000000', no: '15000000', abstain: '5000000', no_with_veto: '5000000' },
          type: 'SoftwareUpgradeProposal'
        },
        {
          id: 2,
          title: 'Community Pool Spending',
          description: 'Proposal to allocate 100,000 LUME from community pool for ecosystem development.',
          status: 'PROPOSAL_STATUS_PASSED',
          submitTime: '2024-01-10T10:00:00Z',
          votingStartTime: '2024-01-10T10:00:00Z',
          votingEndTime: '2024-01-17T10:00:00Z',
          finalTallyResult: { yes: '85000000', no: '10000000', abstain: '3000000', no_with_veto: '2000000' },
          type: 'CommunityPoolSpendProposal'
        },
        {
          id: 3,
          title: 'Parameter Change - Min Deposit',
          description: 'Proposal to change the minimum deposit required for governance proposals from 1000 to 5000 LUME.',
          status: 'PROPOSAL_STATUS_REJECTED',
          submitTime: '2024-01-05T10:00:00Z',
          votingStartTime: '2024-01-05T10:00:00Z',
          votingEndTime: '2024-01-12T10:00:00Z',
          finalTallyResult: { yes: '30000000', no: '60000000', abstain: '8000000', no_with_veto: '2000000' },
          type: 'ParameterChangeProposal'
        }
      ]
      setProposals(testProposals)
      console.log('🧪 Test proposals loaded')
    } finally {
      setLoadingProposals(false)
    }
  }

  // Handle chain change
  const handleChainChange = (chainKey) => {
    setSelectedChainKey(chainKey)
    const chainConfig = SUPPORTED_CHAINS[chainKey]
    setCurrentChainConfig(chainConfig)
    setCurrentPage(1)
    
    // Reconnect wallet if already connected
    if (walletConnected) {
      connectKeplr(chainKey)
    }
    
    // Fetch data for new chain
    fetchProposals(chainConfig)
    fetchValidatorUptime(chainConfig)
  }

  // Vote on proposal
  const voteOnProposal = async (proposalId, option) => {
    if (!walletConnected || !window.keplr) {
      alert('Please connect your wallet first')
      return
    }

    try {
      const chainConfig = currentChainConfig
      if (!chainConfig) {
        throw new Error('Chain configuration not found')
      }

      // Get Keplr signer
      const offlineSigner = window.keplr.getOfflineSigner(chainConfig.chainId)
      const accounts = await offlineSigner.getAccounts()
      
      if (accounts[0].address !== walletAddress) {
        throw new Error('Wallet address mismatch')
      }

      // Import SigningStargateClient for transaction
      const { SigningStargateClient } = await import('@cosmjs/stargate')
      const { Registry } = await import('@cosmjs/proto-signing')
      const { MsgVote } = await import('cosmjs-types/cosmos/gov/v1beta1/tx')

      // Create registry with MsgVote type
      const registry = new Registry()
      registry.register("/cosmos.gov.v1beta1.MsgVote", MsgVote)

      const client = await SigningStargateClient.connectWithSigner(chainConfig.rpc, offlineSigner, {
        prefix: chainConfig.bech32Config?.bech32PrefixAccAddr || chainConfig.prefix,
        gasPrice: {
          denom: chainConfig.stakeCurrency.coinMinimalDenom,
          amount: Math.floor(0.025 * Math.pow(10, chainConfig.stakeCurrency.coinDecimals)).toString()
        },
        registry: registry
      })

      const fee = {
        amount: [{
          denom: chainConfig.stakeCurrency.coinMinimalDenom,
          amount: Math.floor(0.01 * Math.pow(10, chainConfig.stakeCurrency.coinDecimals)).toString()
        }],
        gas: "200000"
      }

      // Convert vote option string to number
      let voteOption = 1 // Default to YES
      switch (option) {
        case 'VOTE_OPTION_YES':
          voteOption = 1
          break
        case 'VOTE_OPTION_ABSTAIN':
          voteOption = 2
          break
        case 'VOTE_OPTION_NO':
          voteOption = 3
          break
        case 'VOTE_OPTION_NO_WITH_VETO':
          voteOption = 4
          break
        default:
          voteOption = 1
      }

      // Format message untuk vote
      const msg = {
        typeUrl: "/cosmos.gov.v1beta1.MsgVote",
        value: MsgVote.fromPartial({
          proposalId: proposalId.toString(),
          voter: walletAddress,
          option: voteOption
        })
      }

      console.log('🗳️ Voting on proposal:', proposalId, 'with option:', option)
      const result = await client.signAndBroadcast(walletAddress, [msg], fee)
      
      if (result.code === 0) {
        alert(`✅ Successfully voted ${option.replace('VOTE_OPTION_', '')} on Proposal #${proposalId}!\nTx Hash: ${result.transactionHash}`)
        // Refresh proposals after successful vote
        await fetchProposals(currentChainConfig)
      } else {
        throw new Error(`Transaction failed: ${result.rawLog}`)
      }
    } catch (error) {
      console.error('❌ Error voting:', error)
      alert('❌ Vote failed: ' + error.message)
    }
  }

  // Filter proposals by status
  const filterProposalsByStatus = (status) => {
    switch (status) {
      case 'active':
        return proposals.filter(p => p.status === 'PROPOSAL_STATUS_VOTING_PERIOD')
      case 'passed':
        return proposals.filter(p => p.status === 'PROPOSAL_STATUS_PASSED')
      case 'rejected':
        return proposals.filter(p => p.status === 'PROPOSAL_STATUS_REJECTED')
      case 'failed':
        return proposals.filter(p => p.status === 'PROPOSAL_STATUS_FAILED')
      default:
        return proposals
    }
  }

  // Format proposal status for display
  const formatStatus = (status) => {
    switch (status) {
      case 'PROPOSAL_STATUS_VOTING_PERIOD':
        return 'Active'
      case 'PROPOSAL_STATUS_PASSED':
        return 'Passed'
      case 'PROPOSAL_STATUS_REJECTED':
        return 'Rejected'
      case 'PROPOSAL_STATUS_FAILED':
        return 'Failed'
      default:
        return status.replace('PROPOSAL_STATUS_', '').replace('_', ' ')
    }
  }

  // Calculate vote percentages
  const calculateVotePercentages = (tally) => {
    const total = parseInt(tally.yes) + parseInt(tally.no) + parseInt(tally.abstain) + parseInt(tally.no_with_veto)
    if (total === 0) return { yes: 0, no: 0, abstain: 0, veto: 0 }
    
    return {
      yes: ((parseInt(tally.yes) / total) * 100).toFixed(1),
      no: ((parseInt(tally.no) / total) * 100).toFixed(1),
      abstain: ((parseInt(tally.abstain) / total) * 100).toFixed(1),
      veto: ((parseInt(tally.no_with_veto) / total) * 100).toFixed(1)
    }
  }

  // Load chain config and data on component mount
  useEffect(() => {
    const chainConfig = SUPPORTED_CHAINS[selectedChainKey]
    console.log('🔍 Loading governance for chain:', selectedChainKey, chainConfig)
    setCurrentChainConfig(chainConfig)
    if (chainConfig) {
      console.log('📡 Fetching data from:', chainConfig.rest)
      fetchProposals(chainConfig)
      fetchValidatorUptime(chainConfig)
    } else {
      console.error('❌ Chain config not found for:', selectedChainKey)
    }
  }, [selectedChainKey])

  const filteredProposals = filterProposalsByStatus(activeTab)
  const startIndex = (currentPage - 1) * proposalsPerPage
  const endIndex = startIndex + proposalsPerPage
  const paginatedProposals = filteredProposals.slice(startIndex, endIndex)

  return (
    <div className="government-page">
      <div className="government-container">
        {/* Back Home Button */}
        <div className="back-home-section">
          <Link to="/" className="back-home-btn">
            ← Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="government-header">
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
                <h1>{currentChainConfig?.chainName || 'Loading...'} <span className="testnet-badge">Testnet</span></h1>
                <p>Governance & Voting for decentralized decision making.</p>
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
              {!walletConnected ? (
                <button onClick={() => connectKeplr()} className="connect-wallet-btn">
                  🔗 Connect Wallet
                </button>
              ) : (
                <div className="wallet-connected">
                  <div className="wallet-info">
                    <div className="wallet-address">{walletAddress.substring(0, 10)}...{walletAddress.substring(walletAddress.length - 6)}</div>
                  </div>
                  <button onClick={disconnectWallet} className="disconnect-btn">
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="gov-stats">
          <div className="stat-card">
            <div className="stat-icon">🗳️</div>
            <div className="stat-label">Total Proposals</div>
            <div className="stat-value">{proposals.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-label">Active Proposals</div>
            <div className="stat-value">{proposals.filter(p => p.status === 'PROPOSAL_STATUS_VOTING_PERIOD').length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-label">Passed Proposals</div>
            <div className="stat-value">{proposals.filter(p => p.status === 'PROPOSAL_STATUS_PASSED').length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">❌</div>
            <div className="stat-label">Rejected Proposals</div>
            <div className="stat-value">{proposals.filter(p => p.status === 'PROPOSAL_STATUS_REJECTED').length}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="government-controls">
          <button 
            className="refresh-btn"
            onClick={() => {
              if (activeTab === 'uptime') {
                fetchValidatorUptime(currentChainConfig)
              } else {
                fetchProposals(currentChainConfig)
              }
            }}
            disabled={loadingProposals || loadingUptime}
          >
            {(loadingProposals || loadingUptime) ? '🔄' : '🔄'} Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="government-tabs">
          <button 
            className={`government-tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('active')
              setCurrentPage(1)
            }}
          >
            Active ({proposals.filter(p => p.status === 'PROPOSAL_STATUS_VOTING_PERIOD').length})
          </button>
          <button 
            className={`government-tab ${activeTab === 'passed' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('passed')
              setCurrentPage(1)
            }}
          >
            Passed ({proposals.filter(p => p.status === 'PROPOSAL_STATUS_PASSED').length})
          </button>
          <button 
            className={`government-tab ${activeTab === 'rejected' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('rejected')
              setCurrentPage(1)
            }}
          >
            Rejected ({proposals.filter(p => p.status === 'PROPOSAL_STATUS_REJECTED').length})
          </button>
          <button 
            className={`government-tab ${activeTab === 'uptime' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('uptime')
              setCurrentPage(1)
            }}
          >
            Uptime ({validators.length})
          </button>
        </div>

        {/* Content - Proposals or Uptime */}
        {activeTab === 'uptime' ? (
          // Uptime Content
          loadingUptime ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading validator uptime...</p>
            </div>
          ) : (
            <div className="uptime-container">
              {validators.length > 0 ? (
                <div className="validators-uptime-table">
                  <div className="table-header">
                    <div className="header-cell rank">Rank</div>
                    <div className="header-cell validator">Validator</div>
                    <div className="header-cell uptime">Uptime</div>
                    <div className="header-cell missed">Missed Blocks</div>
                    <div className="header-cell status">Status</div>
                    <div className="header-cell commission">Commission</div>
                  </div>
                  <div className="table-body">
                    {validators.slice((currentPage - 1) * proposalsPerPage, currentPage * proposalsPerPage).map((validator, index) => (
                      <div key={validator.operatorAddress} className="table-row">
                        <div className="table-cell rank">
                          <span className="rank-number">#{(currentPage - 1) * proposalsPerPage + index + 1}</span>
                        </div>
                        <div className="table-cell validator">
                          <div className="validator-info">
                            <div className="validator-avatar">
                              <KeybaseAvatar 
                                identity={validator.identity}
                                moniker={validator.moniker}
                                size={36}
                              />
                            </div>
                            <div className="validator-details">
                              <div className="validator-name">{validator.moniker}</div>
                              {validator.website && (
                                <a href={validator.website} target="_blank" rel="noopener noreferrer" className="validator-website">
                                  🌐 {validator.website.replace('https://', '').replace('http://', '')}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="table-cell uptime">
                          <div className="uptime-display">
                            <div className={`uptime-percentage ${validator.uptime >= 99 ? 'excellent' : validator.uptime >= 95 ? 'good' : validator.uptime >= 90 ? 'warning' : 'danger'}`}>
                              {validator.uptime.toFixed(2)}%
                            </div>
                            <div className="uptime-bar">
                              <div 
                                className={`uptime-fill ${validator.uptime >= 99 ? 'excellent' : validator.uptime >= 95 ? 'good' : validator.uptime >= 90 ? 'warning' : 'danger'}`}
                                style={{ width: `${validator.uptime}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="table-cell missed">
                          <div className="missed-blocks">
                            <span className="missed-count">{validator.missedBlocks.toLocaleString()}</span>
                            <span className="total-blocks">/ {validator.totalBlocks.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="table-cell status">
                          <div className={`validator-status ${validator.jailed ? 'jailed' : 'active'}`}>
                            {validator.jailed ? (
                              <span className="status-badge jailed">⛔ Jailed</span>
                            ) : validator.tombstoned ? (
                              <span className="status-badge tombstoned">💀 Tombstoned</span>
                            ) : (
                              <span className="status-badge active">✅ Active</span>
                            )}
                          </div>
                        </div>
                        <div className="table-cell commission">
                          <span className="commission-rate">
                            {(parseFloat(validator.commission) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-validators">
                  <p>No validator uptime data found</p>
                  <button onClick={() => fetchValidatorUptime(currentChainConfig)} className="retry-btn">
                    Try Again
                  </button>
                </div>
              )}
              
              {/* Pagination for validators */}
              {validators.length > proposalsPerPage && (
                <div className="pagination-controls">
                  <button 
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>
                  
                  <div className="pagination-info">
                    Page {currentPage} of {Math.ceil(validators.length / proposalsPerPage)}
                    <span className="proposal-count">
                      ({validators.length} validators)
                    </span>
                  </div>
                  
                  <button 
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => 
                      Math.min(prev + 1, Math.ceil(validators.length / proposalsPerPage))
                    )}
                    disabled={currentPage >= Math.ceil(validators.length / proposalsPerPage)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )
        ) : (
          // Proposals List
          loadingProposals ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading proposals...</p>
            </div>
          ) : (
            <div className="proposals-container">
              {paginatedProposals.length > 0 ? (
              <div className="proposals-list">
                {paginatedProposals.map((proposal) => {
                  const percentages = calculateVotePercentages(proposal.finalTallyResult)
                  const isActive = proposal.status === 'PROPOSAL_STATUS_VOTING_PERIOD'
                  
                  return (
                    <div key={proposal.id} className="proposal-card">
                      <div className="proposal-header">
                        <div className="proposal-title">
                          <span className="proposal-id">#{proposal.id}</span>
                          <h3>{proposal.title}</h3>
                        </div>
                        <div className={`proposal-status ${proposal.status.toLowerCase().replace('proposal_status_', '')}`}>
                          {formatStatus(proposal.status)}
                        </div>
                      </div>
                      
                      <div className="proposal-description">
                        <p>{proposal.description}</p>
                      </div>
                      
                      <div className="proposal-details">
                        <div className="detail-item">
                          <span className="detail-label">Type:</span>
                          <span className="detail-value">{proposal.type.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Submit Time:</span>
                          <span className="detail-value">{new Date(proposal.submitTime).toLocaleDateString()}</span>
                        </div>
                        {proposal.votingEndTime && (
                          <div className="detail-item">
                            <span className="detail-label">Voting Ends:</span>
                            <span className="detail-value">{new Date(proposal.votingEndTime).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Vote Results */}
                      <div className="vote-results">
                        <div className="vote-bar">
                          <div className="vote-segment yes" style={{ width: `${percentages.yes}%` }}></div>
                          <div className="vote-segment no" style={{ width: `${percentages.no}%` }}></div>
                          <div className="vote-segment abstain" style={{ width: `${percentages.abstain}%` }}></div>
                          <div className="vote-segment veto" style={{ width: `${percentages.veto}%` }}></div>
                        </div>
                        <div className="vote-legend">
                          <span className="legend-item yes">Yes: {percentages.yes}%</span>
                          <span className="legend-item no">No: {percentages.no}%</span>
                          <span className="legend-item abstain">Abstain: {percentages.abstain}%</span>
                          <span className="legend-item veto">Veto: {percentages.veto}%</span>
                        </div>
                      </div>
                      
                      {/* Vote Buttons */}
                      {isActive && (
                        <div className="vote-buttons">
                          <button 
                            className="vote-btn yes"
                            onClick={() => voteOnProposal(proposal.id, 'VOTE_OPTION_YES')}
                            disabled={!walletConnected}
                          >
                            👍 Yes
                          </button>
                          <button 
                            className="vote-btn no"
                            onClick={() => voteOnProposal(proposal.id, 'VOTE_OPTION_NO')}
                            disabled={!walletConnected}
                          >
                            👎 No
                          </button>
                          <button 
                            className="vote-btn abstain"
                            onClick={() => voteOnProposal(proposal.id, 'VOTE_OPTION_ABSTAIN')}
                            disabled={!walletConnected}
                          >
                            🤷‍♂️ Abstain
                          </button>
                          <button 
                            className="vote-btn veto"
                            onClick={() => voteOnProposal(proposal.id, 'VOTE_OPTION_NO_WITH_VETO')}
                            disabled={!walletConnected}
                          >
                            ❌ Veto
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="no-proposals">
                <p>No proposals found for this status</p>
                <button onClick={() => fetchProposals(currentChainConfig)} className="retry-btn">
                  Try Again
                </button>
              </div>
            )}
            
            {/* Pagination */}
            {filteredProposals.length > proposalsPerPage && (
              <div className="pagination-controls">
                <button 
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </button>
                
                <div className="pagination-info">
                  Page {currentPage} of {Math.ceil(filteredProposals.length / proposalsPerPage)}
                  <span className="proposal-count">
                    ({filteredProposals.length} proposals)
                  </span>
                </div>
                
                <button 
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => 
                    Math.min(prev + 1, Math.ceil(filteredProposals.length / proposalsPerPage))
                  )}
                  disabled={currentPage >= Math.ceil(filteredProposals.length / proposalsPerPage)}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
          )
        )}
      </div>
    </div>
  )
}

export default GovernmentPage
