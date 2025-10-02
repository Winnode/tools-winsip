import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom'
import './App.css'
import ValidatorPage from './components/ValidatorPage.jsx'
import GovernmentPage from './components/GovernmentPage.jsx'

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
    .then(() => {
      console.log('Teks berhasil disalin!')
    })
    .catch(err => {
      console.error('Gagal menyalin teks: ', err)
    })
}

const popularChains = [
  { name: 'Cosmos Hub', id: 'cosmoshub' },
  { name: 'Osmosis', id: 'osmosis' },
  { name: 'Juno', id: 'juno' },
  { name: 'Stargaze', id: 'stargaze' },
  { name: 'Akash', id: 'akash' },
  { name: 'Secret', id: 'secretnetwork' },
  { name: 'Terra', id: 'terra' },
  { name: 'Kujira', id: 'kujira' },
  { name: 'Injective', id: 'injective' },
  { name: 'Evmos', id: 'evmos' },
  { name: 'Stride', id: 'stride' },
  { name: 'Comdex', id: 'comdex' }
]

// Main App component content
function AppContent() {
  const [selectedChain, setSelectedChain] = useState('')
  const [customChain, setCustomChain] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState('')
  const [activeTab, setActiveTab] = useState('scanner')
  const [stakingData, setStakingData] = useState(null)
  const [loadingStaking, setLoadingStaking] = useState(false)
  const [allChainsData, setAllChainsData] = useState({})
  const [lastUpdated, setLastUpdated] = useState(null) // Add state for tab navigation
  const [stakingAmount, setStakingAmount] = useState('')
  const [stakingPeriod, setStakingPeriod] = useState('365')
  const [calculatorResults, setCalculatorResults] = useState(null)
  const [chainSearchTerm, setChainSearchTerm] = useState('')
  const [showChainDropdown, setShowChainDropdown] = useState(false)
  
  const handleCopyAddress = (address) => {
    copyToClipboard(address)
    setCopiedAddress(address)
    
    setTimeout(() => {
      setCopiedAddress('')
    }, 2000)
  }

  const handleChainSelect = (chainId) => {
    setSelectedChain(chainId)
    setCustomChain('')
  }

  const handleCustomChainChange = (e) => {
    setCustomChain(e.target.value)
    setSelectedChain('')
  }

  const handleForceUpdateDatabase = async () => {
    console.log('Force updating database now...')
    await generateDatabase()
  }
  
  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const CACHE_DURATION = 24 * 60 * 60 * 1000;
  const [database, setDatabase] = useState(null);
  const [databaseLoading, setDatabaseLoading] = useState(false);
  const [updateProgress, setUpdateProgress] = useState({ current: 0, total: 0, chainName: '' });

  const getCachedData = (chainId) => {
    try {
      const cached = localStorage.getItem(`chain_data_${chainId}`)
      if (cached) {
        const data = JSON.parse(cached)
        const now = Date.now()
        if (now - data.timestamp < CACHE_DURATION) {
          return data.stakingData
        }
      }
    } catch (error) {
      console.error('Error reading cache:', error)
    }
    return null
  }

  const setCachedData = (chainId, stakingData) => {
    try {
      const cacheData = {
        stakingData,
        timestamp: Date.now()
      }
      localStorage.setItem(`chain_data_${chainId}`, JSON.stringify(cacheData))
    } catch (error) {
      console.error('Error setting cache:', error)
    }
  }

  // Get real staking data from database or API
  const getStoredStakingData = (chainId) => {
    if (database?.stakingData?.[chainId]) {
      return database.stakingData[chainId]
    }
    return null
  }

  const fetchStakingData = async (chainId) => {
    const cachedData = getCachedData(chainId)
    if (cachedData) {
      console.log(`Using cached data for ${chainId}`)
      return cachedData
    }

    try {
      console.log(`Fetching staking data for ${chainId}...`)
      const baseUrl = `https://rest.cosmos.directory/${chainId}`
      
      // Add timeout to fetch requests
      const fetchWithTimeout = (url, options, timeout = 10000) => {
        return Promise.race([
          fetch(url, options),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ])
      }
      
      const [inflationRes, stakingPoolRes, distParamsRes] = await Promise.all([
        fetchWithTimeout(`${baseUrl}/cosmos/mint/v1beta1/inflation`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          mode: 'cors'
        }),
        fetchWithTimeout(`${baseUrl}/cosmos/staking/v1beta1/pool`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          mode: 'cors'
        }),
        fetchWithTimeout(`${baseUrl}/cosmos/distribution/v1beta1/params`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          mode: 'cors'
        })
      ])

      console.log(`API responses status: inflation=${inflationRes.status}, pool=${stakingPoolRes.status}, params=${distParamsRes.status}`)

      if (!inflationRes.ok || !stakingPoolRes.ok || !distParamsRes.ok) {
        console.error(`API request failed for ${chainId}:`, {
          inflation: inflationRes.status,
          stakingPool: stakingPoolRes.status,
          distParams: distParamsRes.status
        })
        return null
      }

      const [inflation, stakingPool, distParams] = await Promise.all([
        inflationRes.json(),
        stakingPoolRes.json(),
        distParamsRes.json()
      ])

      console.log(`Raw API data for ${chainId}:`, { inflation, stakingPool, distParams })

      const infl = parseFloat(inflation?.inflation || '0')
      const bonded = parseFloat(stakingPool?.pool?.bonded_tokens || '0')
      const notBonded = parseFloat(stakingPool?.pool?.not_bonded_tokens || '0')
      const commTax = parseFloat(distParams?.params?.community_tax || '0')
      const denomTotal = bonded + notBonded
      const bondedRatio = denomTotal > 0 ? bonded / denomTotal : 0

      let apr = null
      if (bondedRatio > 0) {
        apr = (infl * (1.0 - commTax) / bondedRatio) * 100.0
      }

      const stakingData = {
        apr: apr ? parseFloat(apr.toFixed(4)) : null,
        inflation: parseFloat((infl * 100).toFixed(6)),
        communityTax: parseFloat((commTax * 100).toFixed(6)),
        bondedRatio: parseFloat((bondedRatio * 100).toFixed(6))
      }

      console.log(`Calculated staking data for ${chainId}:`, stakingData)
      setCachedData(chainId, stakingData)
      return stakingData
    } catch (error) {
      console.error(`Detailed error fetching staking data for ${chainId}:`, {
        message: error.message,
        stack: error.stack,
        chainId: chainId
      })
      
      // Use stored database data if available
      const storedData = getStoredStakingData(chainId)
      if (storedData) {
        console.log(`Using stored database data for ${chainId}`)
        setCachedData(chainId, storedData)
        return storedData
      }
      
      return null
    }
  }

  const fetchJson = async (url, sourceName) => {
    try {
      const response = await fetch(url, { 
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        mode: 'cors'
      })
      
      if (response.ok) {
        console.log(`✔ Mengambil data dari ${sourceName} berhasil`)
        return await response.json()
      } else {
        console.log(`✖ ${sourceName} error: HTTP ${response.status}`)
        return null
      }
    } catch (error) {
      console.log(`✖ ${sourceName} error: ${error.message}`)
      return null
    }
  }

  // Fungsi untuk cek status endpoint
  const checkEndpointStatus = async (endpoint) => {
    try {
      let url = endpoint.address
      if (!url.startsWith('http')) {
        url = 'https://' + url
      }
      
      const startTime = Date.now()
      let testUrl = url
      
      // Different test endpoints for different types
      if (endpoint.type === 'RPC') {
        testUrl = url.endsWith('/') ? url + 'status' : url + '/status'
      } else if (endpoint.type === 'API') {
        testUrl = url.endsWith('/') ? url + 'node_info' : url + '/node_info'
      } else if (endpoint.type === 'gRPC') {
        // For gRPC, we'll test the base URL or a common endpoint
        testUrl = url
      }
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        mode: 'cors'
      })
      
      const endTime = Date.now()
      const latency = endTime - startTime
      
      if (response.ok) {
        const data = await response.json()
        let blockHeight = null
        
        if (endpoint.type === 'RPC' && data.result && data.result.sync_info) {
          blockHeight = parseInt(data.result.sync_info.latest_block_height)
        } else if (endpoint.type === 'API' && data.default_node_info) {
          // For REST API endpoints
          blockHeight = null // REST API might not have block height in this endpoint
        } else if (data.block_height) {
          blockHeight = parseInt(data.block_height)
        }
        
        return {
          ...endpoint,
          status: 'ONLINE',
          latency,
          block: blockHeight
        }
      } else {
        return {
          ...endpoint,
          status: 'OFFLINE',
          latency: null,
          block: null
        }
      }
    } catch (error) {
      return {
        ...endpoint,
        status: 'OFFLINE',
        latency: null,
        block: null
      }
    }
  }

  const loadDatabase = async () => {
    try {
      // Load from localStorage (web storage)
      const stored = localStorage.getItem('database_backup');
      if (stored) {
        const data = JSON.parse(stored);
        console.log('Database loaded from browser localStorage');
        setDatabase(data);
        return data;
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    
    console.log('No database found in browser storage');
    return null;
  };



  const generateDatabase = async () => {
    setDatabaseLoading(true);
    try {
      console.log('Generating comprehensive database...');
      
      // Clear old data from localStorage and local file
      console.log('Clearing old database data from localStorage and preparing new local file...');
      localStorage.removeItem('database_backup');
      localStorage.removeItem('chains_data');
      localStorage.removeItem('chains_data_timestamp');
      
      // Clear current state
      setDatabase(null);
      setAllChainsData({});
      
      const response = await fetch('https://chains.cosmos.directory/');
      if (!response.ok) throw new Error('Failed to fetch chains directory');
      
      const directoryData = await response.json();
      const newDatabase = {
        metadata: {
          lastUpdated: Date.now(),
          version: '1.0.0',
          updateInterval: CACHE_DURATION,
          totalChains: 0
        },
        chains: {},
        endpoints: {},
        stakingData: {}
      };
      
      let processedChains = 0;
      const totalChains = directoryData.chains?.length || 0;
      setUpdateProgress({ current: 0, total: totalChains, chainName: 'Starting...' });
      
      for (const chain of directoryData.chains || []) {
        if (chain.chain_id && chain.chain_name) {
          processedChains++;
          setUpdateProgress({ current: processedChains, total: totalChains, chainName: chain.chain_name });
          console.log(`Processing ${processedChains}/${totalChains}: ${chain.chain_name}`);
          
          newDatabase.chains[chain.chain_id] = {
            chain_id: chain.chain_id,
            chain_name: chain.chain_name,
            pretty_name: chain.pretty_name || chain.chain_name,
            network_type: chain.network_type,
            status: chain.status,
            bech32_prefix: chain.bech32_prefix,
            daemon_name: chain.daemon_name,
            node_home: chain.node_home,
            key_algos: chain.key_algos,
            slip44: chain.slip44,
            fees: chain.fees,
            staking: chain.staking,
            codebase: chain.codebase,
            logo_URIs: chain.logo_URIs,
            description: chain.description,
            peers: chain.peers,
            apis: chain.apis
          };
          
          if (chain.apis) {
            newDatabase.endpoints[chain.chain_id] = {
              rpc: chain.apis.rpc || [],
              rest: chain.apis.rest || [],
              grpc: chain.apis.grpc || []
            };
          }
          
          try {
            const stakingInfo = await fetchStakingData(chain.chain_id);
            if (stakingInfo) {
              newDatabase.stakingData[chain.chain_id] = {
                ...stakingInfo,
                lastUpdated: Date.now()
              };
            }
          } catch (error) {
            console.error(`Error fetching staking data for ${chain.chain_id}:`, error);
          }
          
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      newDatabase.metadata.totalChains = processedChains;
      
      console.log(`Database generation completed! Processed ${processedChains} chains`);
      
      // Save to database state and browser storage
      setDatabase(newDatabase);
      setAllChainsData(newDatabase.chains);
      setLastUpdated(newDatabase.metadata.lastUpdated);
      
      // Save to localStorage (web storage only)
      localStorage.setItem('database_backup', JSON.stringify(newDatabase));
      localStorage.setItem('chains_data', JSON.stringify(newDatabase.chains));
      localStorage.setItem('chains_data_timestamp', newDatabase.metadata.lastUpdated.toString());
      
      setUpdateProgress({ current: 0, total: 0, chainName: '' });
      
      console.log('Database saved to browser localStorage (web storage)');
      console.log(`Database updated successfully with ${processedChains} chains`);
      console.log('Data stored in browser cache, accessible on web only');
      console.log(`Next update scheduled in 24 hours at: ${new Date(Date.now() + CACHE_DURATION).toLocaleString()}`);
      
    } catch (error) {
      console.error('Error generating database:', error);
    } finally {
      setDatabaseLoading(false);
    }
  };

  const fetchAllChainsData = async () => {
    try {
      const response = await fetch('https://chains.cosmos.directory/');
      if (!response.ok) throw new Error('Failed to fetch chains');
      
      const data = await response.json();
      const chainsData = {};
      
      for (const chain of data.chains || []) {
        if (chain.chain_id && chain.chain_name) {
          chainsData[chain.chain_id] = {
            name: chain.chain_name,
            pretty_name: chain.pretty_name || chain.chain_name,
            network_type: chain.network_type,
            status: chain.status
          };
        }
      }
      
      setAllChainsData(chainsData);
      localStorage.setItem('all_chains_data', JSON.stringify({
        data: chainsData,
        timestamp: Date.now()
      }));
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Error fetching all chains data:', error);
    }
  };

  const loadCachedChainsData = () => {
    try {
      const cached = localStorage.getItem('all_chains_data');
      if (cached) {
        const parsedData = JSON.parse(cached);
        const now = Date.now();
        if (now - parsedData.timestamp < CACHE_DURATION) {
          setAllChainsData(parsedData.data);
          setLastUpdated(parsedData.timestamp);
          return true;
        }
      }
    } catch (error) {
      console.error('Error loading cached chains data:', error);
    }
    return false;
  };

  useEffect(() => {
    const initializeData = async () => {
      const db = await loadDatabase();
      if (db && db.metadata && db.metadata.lastUpdated) {
        const isExpired = Date.now() - db.metadata.lastUpdated > CACHE_DURATION;
        if (!isExpired) {
          setDatabase(db);
          setAllChainsData(db.chains || {});
          setLastUpdated(db.metadata.lastUpdated);
          return;
        }
      }
      
      // Check if database is empty or doesn't exist
      const isEmpty = !db || !db.metadata || !db.metadata.lastUpdated || Object.keys(db.chains || {}).length === 0;
      
      if (isEmpty) {
        console.log('Database is empty, generating comprehensive database...');
        await generateDatabase();
      } else {
        const cached = loadCachedChainsData();
        if (cached) {
          setAllChainsData(cached);
          setLastUpdated(Date.now());
        } else {
          await fetchAllChainsData();
        }
      }
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (database && database.metadata) {
        const isExpired = Date.now() - database.metadata.lastUpdated > CACHE_DURATION;
        if (isExpired) {
          console.log('Database expired after 24 hours, clearing old data and regenerating...');
          await generateDatabase();
        }
      }
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [database]);

  // Force update every 24 hours regardless
  useEffect(() => {
    const forceUpdateInterval = setInterval(async () => {
      console.log('24-hour force update: clearing old database and fetching new data...');
      await generateDatabase();
    }, CACHE_DURATION); // Every 24 hours

    return () => clearInterval(forceUpdateInterval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.chain-search-container')) {
        setShowChainDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Set default tab on component mount
  useEffect(() => {
    console.log('Current activeTab:', activeTab);
    if (!activeTab || activeTab === '') {
      console.log('Setting default tab to scanner');
      setActiveTab('scanner');
    }
  }, []);

  // Debug activeTab state changes
  useEffect(() => {
    console.log('ActiveTab changed to:', activeTab);
  }, [activeTab]);

  const calculateRewards = async () => {
    console.log('=== Calculate Rewards Started ===');
    console.log('Selected Chain:', selectedChain);
    
    const amountElement = document.getElementById('stakingAmount');
    const periodElement = document.getElementById('stakingPeriod');
    
    console.log('Amount Element:', amountElement);
    console.log('Period Element:', periodElement);
    
    if (!amountElement || !periodElement) {
      console.error('Required DOM elements not found!');
      return;
    }
    
    const amount = parseFloat(amountElement.value);
    const period = parseInt(periodElement.value);
    
    console.log('Amount:', amount, 'Period:', period);
    
    if (!amount || amount <= 0) {
      console.log('Invalid amount entered');
      document.getElementById('calculatorResults').innerHTML = '<p style="color: #ff6b6b;">Please enter a valid staking amount.</p>';
      return;
    }
    
    if (!selectedChain) {
      console.log('No chain selected');
      document.getElementById('calculatorResults').innerHTML = '<p style="color: #ff6b6b;">Please select a chain.</p>';
      return;
    }
    
    console.log('Starting calculation process...');
    document.getElementById('calculatorResults').innerHTML = '<div class="loading-spinner"></div><p>Calculating rewards...</p>';
    
    try {
      console.log('Fetching staking data for:', selectedChain);
      const stakingInfo = await fetchStakingData(selectedChain);
      console.log('Received staking info:', stakingInfo);
      
      if (!stakingInfo || !stakingInfo.apr) {
        console.log('No staking info or APR available, checking fallback data...');
        
        // Try to use fallback data if available
        console.log('Checking fallback data for selectedChain:', selectedChain);
        // Try multiple fallback keys: selectedChain directly, or extract chain name from chain_id
        let fallbackKey = selectedChain;
        let fallbackInfo = fallbackStakingData[fallbackKey];
        
        // If not found and selectedChain looks like a chain_id (contains '-'), try extracting base name
        if (!fallbackInfo && selectedChain.includes('-')) {
          fallbackKey = selectedChain.split('-')[0]; // e.g., 'cosmoshub-4' -> 'cosmoshub'
          fallbackInfo = fallbackStakingData[fallbackKey];
        }
        
        // Also try looking up by chain name if we have chain data
        if (!fallbackInfo && allChainsData[selectedChain]) {
          const chainName = allChainsData[selectedChain].name || allChainsData[selectedChain].pretty_name;
          if (chainName) {
            fallbackInfo = fallbackStakingData[chainName];
            if (fallbackInfo) {
              fallbackKey = chainName;
            }
          }
        }
        
        if (fallbackInfo) {
          console.log('Using fallback data for key:', fallbackKey, 'data:', fallbackInfo);
          
          // Use fallback data for calculation
          const apr = parseFloat(fallbackInfo.apr);
          console.log('Fallback APR:', apr);
          
          const dailyRate = apr / 365 / 100;
          console.log('Daily Rate:', dailyRate);
          
          const totalRewards = amount * dailyRate * period;
          console.log('Total Rewards:', totalRewards);
          
          const finalAmount = amount + totalRewards;
          const roi = (totalRewards / amount) * 100;
          
          console.log('Final calculations (fallback) - Amount:', amount, 'Total Rewards:', totalRewards, 'Final Amount:', finalAmount, 'ROI:', roi);
          
          const resultsHTML = `
            <div class="reward-results">
              <div class="result-card">
                <h4>Staking Details</h4>
                <p><strong>Chain:</strong> ${selectedChain}</p>
                <p><strong>Amount:</strong> ${amount.toLocaleString()} tokens</p>
                <p><strong>Period:</strong> ${period} days</p>
                <p><strong>APR:</strong> ${apr}% (fallback data)</p>
              </div>
              
              <div class="result-card">
                <h4>Reward Calculation</h4>
                <p><strong>Daily Rate:</strong> ${(dailyRate * 100).toFixed(6)}%</p>
                <p><strong>Total Rewards:</strong> ${totalRewards.toLocaleString(undefined, {maximumFractionDigits: 2})} tokens</p>
                <p><strong>Final Amount:</strong> ${finalAmount.toLocaleString(undefined, {maximumFractionDigits: 2})} tokens</p>
                <p><strong>ROI:</strong> ${roi.toFixed(2)}%</p>
              </div>
              
              <div class="result-card">
                <h4>Additional Info</h4>
                <p><strong>Inflation:</strong> ${fallbackInfo.inflation}%</p>
                <p><strong>Community Tax:</strong> ${fallbackInfo.communityTax}%</p>
                <p><strong>Bonded Ratio:</strong> ${fallbackInfo.bondedRatio}%</p>
                <p><em>Note: Using cached data due to API unavailability</em></p>
              </div>
            </div>
          `;
          
          document.getElementById('calculatorResults').innerHTML = resultsHTML;
          return;
        }
        
        // No fallback data available
        const errorMsg = `Staking data not available for "${selectedChain}". Try popular chains like Cosmos Hub, Osmosis, or Juno.`;
        document.getElementById('calculatorResults').innerHTML = `<p style="color: #ff6b6b;">${errorMsg}</p>`;
        return;
      }
      
      const apr = parseFloat(stakingInfo.apr);
      console.log('APR:', apr);
      
      const dailyRate = apr / 365 / 100;
      console.log('Daily Rate:', dailyRate);
      
      const totalRewards = amount * dailyRate * period;
      console.log('Total Rewards:', totalRewards);
      
      const finalAmount = amount + totalRewards;
      const roi = (totalRewards / amount) * 100;
      
      console.log('Final calculations - Amount:', amount, 'Total Rewards:', totalRewards, 'Final Amount:', finalAmount, 'ROI:', roi);
      
      const resultsHTML = `
        <div class="reward-results">
          <div class="result-card">
            <h4>Staking Details</h4>
            <p><strong>Chain:</strong> ${selectedChain}</p>
            <p><strong>Amount:</strong> ${amount.toLocaleString()} tokens</p>
            <p><strong>Period:</strong> ${period} days</p>
            <p><strong>APR:</strong> ${apr}%</p>
          </div>
          
          <div class="result-card">
            <h4>Reward Calculation</h4>
            <p><strong>Daily Rate:</strong> ${(dailyRate * 100).toFixed(6)}%</p>
            <p><strong>Total Rewards:</strong> ${totalRewards.toLocaleString(undefined, {maximumFractionDigits: 2})} tokens</p>
            <p><strong>Final Amount:</strong> ${finalAmount.toLocaleString(undefined, {maximumFractionDigits: 2})} tokens</p>
            <p><strong>ROI:</strong> ${roi.toFixed(2)}%</p>
          </div>
          
          <div class="result-card">
            <h4>Additional Info</h4>
            <p><strong>Inflation:</strong> ${stakingInfo.inflation}%</p>
            <p><strong>Community Tax:</strong> ${stakingInfo.communityTax}%</p>
            <p><strong>Bonded Ratio:</strong> ${stakingInfo.bondedRatio}%</p>
          </div>
        </div>
      `;
      
      document.getElementById('calculatorResults').innerHTML = resultsHTML;
    } catch (error) {
      console.error('Error calculating rewards:', error);
      document.getElementById('calculatorResults').innerHTML = '<p style="color: #ff6b6b;">Error calculating rewards. Please try again.</p>';
    }
  };

  const checkEndpoints = async () => {
    const chainId = selectedChain || customChain
    if (!chainId) return
    
    setLoading(true)
    setLoadingStaking(true)
    setResults([])
    setStakingData(null)
    
    try {
      console.log(`🔍 Mencari endpoint untuk chain: ${chainId}`)
      
      const sources = [
        { url: `https://cosmos-chain.directory/chains/${chainId}`, name: 'Chain Directory' },
        { url: `https://proxy.atomscan.com/chains/${chainId}`, name: 'Atomscan' },
        { url: `https://raw.githubusercontent.com/cosmos/chain-registry/master/${chainId}/chain.json`, name: 'Chain Registry' }
      ]
      
      let endpoints = []
      
      for (const source of sources) {
        const data = await fetchJson(source.url, source.name)
        
        if (data) {
          // RPC endpoints
          if (data.apis && data.apis.rpc) {
            endpoints = [...endpoints, ...data.apis.rpc.map(e => ({
              address: e.address,
              type: 'RPC',
              provider: e.provider || 'Unknown',
              source: source.name
            }))]
          }
          
          // REST API endpoints
          if (data.apis && data.apis.rest) {
            endpoints = [...endpoints, ...data.apis.rest.map(e => ({
              address: e.address,
              type: 'API',
              provider: e.provider || 'Unknown',
              source: source.name
            }))]
          }
          
          // gRPC endpoints
          if (data.apis && data.apis.grpc) {
            endpoints = [...endpoints, ...data.apis.grpc.map(e => ({
              address: e.address,
              type: 'gRPC',
              provider: e.provider || 'Unknown',
              source: source.name
            }))]
          }
          
          // Legacy RPC format
          if (data.rpc) {
            endpoints = [...endpoints, ...data.rpc.map(e => ({
              address: e.url || e.address,
              type: 'RPC',
              provider: e.provider || 'Unknown',
              source: source.name
            }))]
          }
        }
      }
      
      const uniqueEndpoints = [...new Map(endpoints.map(e => [e.address, e])).values()]
      
      console.log(`🔎 Ditemukan ${uniqueEndpoints.length} endpoint unik`)
      
      if (uniqueEndpoints.length === 0) {
        console.log('❌ Tidak ditemukan endpoint untuk chain ini')
        setLoading(false)
        return
      }
      
      const allResults = await Promise.all(uniqueEndpoints.map(checkEndpointStatus))
      
      const onlineResults = allResults
        .filter(result => result.status === 'ONLINE')
        .sort((a, b) => (a.latency || 9999) - (b.latency || 9999))
      
      if (onlineResults.length > 0) {
        console.log(`✅ Ditemukan ${onlineResults.length} endpoint online`)
        
        setResults(onlineResults)
      }
      
      const finalOnlineResults = allResults
        .filter(result => result.status === 'ONLINE')
        .sort((a, b) => (a.latency || 9999) - (b.latency || 9999))
      
      setResults(finalOnlineResults)
      console.log(`✅ Selesai! Ditemukan ${finalOnlineResults.length} endpoint online dari ${endpoints.length} total endpoint`)
      
      const stakingInfo = await fetchStakingData(chainId)
      setStakingData(stakingInfo)
      setLoadingStaking(false)
      
    } catch (error) {
      console.error('❌ Error checking endpoints:', error)
      setResults([])
    } finally {
      setLoading(false)
      setLoadingStaking(false)
    }
  }

  return (
    <div className="app">
      <div className="container">
        {copiedAddress && (
          <div className="copy-notification">
            <span>✓</span> Alamat berhasil disalin ke clipboard
          </div>
        )}
        
        <div className="status-bar">
          <div className="status-indicator">
            <div className="status-dot"></div>
            All Systems Operational
          </div>
        </div>
        
        <header className="header">
          <h1>
            <span className="title-main">Professional Blockchain</span>
            <span className="title-accent">Validation Services</span>
          </h1>
            <p className="by-line flex items-center gap-1">
              <span className="text-gray-400">by  </span>
              <span className="flex items-center gap-1">
                <img 
                  src="/favicon.ico" 
                  alt="Winsnip Logo" 
                  className="w-4 h-4"
                />
                <span className="font-semibold text-purple-400">Winsnip</span>
              </span>
            </p>

          <p className="description">Secure, reliable validation infrastructure with competitive rates and proven performance across multiple networks.</p>
          

          
          <div className="cta-buttons">
            <Link to="/validators" className="btn btn-primary">Validators <span className="arrow">→</span></Link>
            <Link to="/governance" className="btn btn-primary">Governance <span className="arrow">→</span></Link>
            <button className="btn btn-secondary" onClick={() => window.open('https://service.winsnip.xyz/service/', '_blank')}>Guide Validator</button>
          </div>
        </header>
        
        <div className="tab-buttons">
          <Link to="/validators" className="tab-button">
            Validators
          </Link>
          <Link to="/governance" className="tab-button">
            Governance
          </Link>
          <button 
            className={`tab-button ${activeTab === 'scanner' ? 'active' : ''}`}
            onClick={() => {
              console.log('Switching to scanner tab');
              setActiveTab('scanner');
            }}
          >
            RPC Scanner
          </button>
          <button 
            className={`tab-button ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => {
              console.log('Switching to calculator tab');
              setActiveTab('calculator');
            }}
          >
            Staking Calculator
          </button>
          <button 
            className={`tab-button ${activeTab === 'documentation' ? 'active' : ''}`}
            onClick={() => setActiveTab('documentation')}
          >
            Documentation
          </button>
        </div>
        
        {activeTab === 'scanner' && (
        <div className="chain-selection-container">
          
          <div className="popular-chains">
            <h3>Select Popular Chain</h3>
            <div className="dropdown-container">
              <select 
                className="chain-select" 
                value={selectedChain} 
                onChange={(e) => handleChainSelect(e.target.value)}
              >
                <option value="">Select Popular Chain</option>
                {popularChains.map((chain) => (
                  <option key={chain.id} value={chain.id}>
                    {chain.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="custom-chain-input">
              <h3>Or enter custom chain name:</h3>
              <input
                type="text"
                className="custom-input"
                placeholder="Example: osmosis, juno, etc"
                value={customChain}
                onChange={handleCustomChainChange}
              />
            </div>
            
            <div className="search-button-container">
              <button 
                className="btn btn-primary search-btn" 
                onClick={checkEndpoints}
                disabled={!selectedChain && !customChain}
              >
                Search Endpoints
              </button>
            </div>
          </div>
          
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Searching endpoints...</p>
            </div>
          )}
          
          {!loading && results.length > 0 && (
            <div className="results-container">
              <div className="results-header">
                <div>
                  <h3>🔍 RPC Scanner Results</h3>
                  <span className="endpoint-count">{results.length} active endpoints found</span>
                </div>
                <span className="chain-name">{selectedChain || customChain}</span>
              </div>
              
              {stakingData && (
                <div className="staking-info-container">
                  <h4>Staking Rewards Information</h4>
                  <div className="staking-cards">
                    <div className="staking-card">
                      <div className="staking-label">APR</div>
                      <div className="staking-value">
                        {stakingData.apr ? `${stakingData.apr}%` : 'N/A'}
                      </div>
                    </div>
                    <div className="staking-card">
                      <div className="staking-label">Inflation</div>
                      <div className="staking-value">
                        {stakingData.inflation ? `${stakingData.inflation}%` : 'N/A'}
                      </div>
                    </div>
                    <div className="staking-card">
                      <div className="staking-label">Community Tax</div>
                      <div className="staking-value">
                        {stakingData.communityTax ? `${stakingData.communityTax}%` : 'N/A'}
                      </div>
                    </div>
                    <div className="staking-card">
                      <div className="staking-label">Bonded Ratio</div>
                      <div className="staking-value">
                        {stakingData.bondedRatio ? `${stakingData.bondedRatio}%` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {loadingStaking && (
                <div className="staking-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading staking data...</p>
                </div>
              )}
              <div className="table-container">
                <div className="table-header">
                  <div>RPC/gRPC Endpoint</div>
                  <div>Provider</div>
                  <div>Status</div>
                  <div>Latency</div>
                  <div>APR</div>
                </div>
                <div className="table-body">
                  {results.map((result, index) => {
                    let port = '443';
                    try {
                      const url = new URL(result.address.startsWith('http') ? result.address : `https://${result.address}`);
                      port = url.port || (url.protocol === 'https:' ? '443' : '80');
                    } catch (e) {
                    }
                    
                    return (
                      <div key={index} className="table-row">
                        <div className="endpoint-cell">
                          <div className="endpoint-grid">
                            <div className="endpoint-type">
                              <span className={`type-badge-compact ${result.type.toLowerCase()}`}>
                                {result.type}
                              </span>
                            </div>
                            <div className="endpoint-buttons">
                              <a 
                                href={result.address.startsWith('http') ? result.address : `https://${result.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="visit-btn-clickable"
                                title="Visit endpoint"
                              >
                                🔗
                              </a>
                              <button 
                                className="copy-btn-clickable"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleCopyAddress(result.address);
                                }}
                                title="Copy address"
                              >
                                {copiedAddress === result.address ? '✅' : '📋'}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="provider">{result.provider}</div>
                        <div className="status">
                          <div className={`status-indicator ${result.status.toLowerCase()}`}>
                            <div className={`status-dot ${result.status.toLowerCase()}`}></div>
                            <span className="status-text">{result.status === 'ONLINE' ? 'Online' : 'Offline'}</span>
                          </div>
                        </div>
                        <div className="latency">
                          {result.latency ? `${result.latency}ms` : '-'}
                        </div>
                        <div className="apr-cell">
                          {stakingData && stakingData.apr ? `${stakingData.apr}%` : '-'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
        )}
        
        {activeTab === 'calculator' && (
          <div className="calculator-content">
            <h2>Staking Rewards Calculator</h2>
            <div className="calculator-container">
              <div className="calculator-form">
                <div className="form-group">
                  <label htmlFor="chain-search">Search & Select Chain:</label>
                  <div className="chain-search-container">
                    <input
                      id="chain-search"
                      type="text"
                      className="chain-search-input"
                      placeholder="Search for a chain..."
                      value={chainSearchTerm}
                      onChange={(e) => {
                        setChainSearchTerm(e.target.value);
                        setShowChainDropdown(true);
                      }}
                      onFocus={() => setShowChainDropdown(true)}
                    />
                    {showChainDropdown && (
                      <div className="chain-dropdown">
                        {(() => {
                          const filteredChains = Object.entries(allChainsData)
                            .filter(([chainId, chainInfo]) => {
                              const searchLower = chainSearchTerm.toLowerCase();
                              const chainName = (chainInfo.pretty_name || chainInfo.name || chainId).toLowerCase();
                              return chainName.includes(searchLower) || chainId.toLowerCase().includes(searchLower);
                            });
                          
                          return (
                            <>
                              <div className="dropdown-header">
                                {filteredChains.length} chains available
                              </div>
                              {filteredChains.map(([chainId, chainInfo]) => (
                                <div
                                  key={chainId}
                                  className={`chain-option ${selectedChain === chainId ? 'selected' : ''}`}
                                  onClick={() => {
                                    setSelectedChain(chainId);
                                    setChainSearchTerm(chainInfo.pretty_name || chainInfo.name || chainId);
                                    setShowChainDropdown(false);
                                  }}
                                >
                                  <div className="chain-name">{chainInfo.pretty_name || chainInfo.name || chainId}</div>
                                  <div className="chain-id">{chainId}</div>
                                </div>
                              ))}
                              {filteredChains.length === 0 && (
                                <div className="no-results">No chains found</div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Staking Amount:</label>
                  <input 
                    type="number" 
                    placeholder="Enter amount to stake"
                    className="amount-input"
                    id="stakingAmount"
                  />
                </div>
                
                <div className="form-group">
                  <label>Staking Period:</label>
                  <select className="period-select" id="stakingPeriod">
                    <option value="30">1 Month</option>
                    <option value="90">3 Months</option>
                    <option value="180">6 Months</option>
                    <option value="365">1 Year</option>
                  </select>
                </div>
                
                <div className="database-controls">
                  <button 
                    onClick={handleForceUpdateDatabase} 
                    disabled={databaseLoading}
                    className="update-database-btn"
                  >
                    {databaseLoading ? (
                      updateProgress.total > 0 ? 
                        `🔄 Processing ${updateProgress.current}/${updateProgress.total} - ${updateProgress.chainName}` :
                        '🔄 Initializing...'
                    ) : '📥 Update Database Now'}
                  </button>
                  {databaseLoading && updateProgress.total > 0 && (
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${(updateProgress.current / updateProgress.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {updateProgress.current}/{updateProgress.total} chains processed
                      </span>
                    </div>
                  )}
                  {lastUpdated && (
                    <span className="last-updated">
                      Last updated: {new Date(lastUpdated).toLocaleString()}
                    </span>
                  )}
                </div>
                
                <button 
                   className="calculate-button"
                   onClick={calculateRewards}
                   disabled={!selectedChain}
                 >
                   Calculate Rewards
                 </button>
              </div>
              
              <div className="calculator-results">
                <h3>Calculation Results</h3>
                <div id="calculatorResults">
                  <p>Select a chain and enter staking details to calculate rewards.</p>
                </div>
              </div>
            </div>
          </div>
        )}



        {activeTab === 'governance' && (
          <div className="governance-content">
            <h2>Governance Dashboard</h2>
            <div className="governance-container">
              <div className="governance-section">
                <h3>Active Proposals</h3>
                <div className="proposal-card">
                  <div className="proposal-header">
                    <span className="proposal-id">#142</span>
                    <span className="proposal-status active">Voting Period</span>
                  </div>
                  <h4>Cosmos Hub Software Upgrade v18</h4>
                  <p>Proposal to upgrade the Cosmos Hub to v18 with new features and improvements.</p>
                  <div className="proposal-stats">
                    <div className="stat">
                      <span className="label">Yes:</span>
                      <span className="value">67.8%</span>
                    </div>
                    <div className="stat">
                      <span className="label">No:</span>
                      <span className="value">12.3%</span>
                    </div>
                    <div className="stat">
                      <span className="label">Abstain:</span>
                      <span className="value">19.9%</span>
                    </div>
                  </div>
                  <div className="proposal-actions">
                    <button className="btn btn-primary">Vote</button>
                    <button className="btn btn-secondary">View Details</button>
                  </div>
                </div>
                
                <div className="proposal-card">
                  <div className="proposal-header">
                    <span className="proposal-id">#141</span>
                    <span className="proposal-status passed">Passed</span>
                  </div>
                  <h4>Community Pool Spend for Interchain Security</h4>
                  <p>Funding proposal to support Interchain Security development and testing.</p>
                  <div className="proposal-stats">
                    <div className="stat">
                      <span className="label">Yes:</span>
                      <span className="value">84.2%</span>
                    </div>
                    <div className="stat">
                      <span className="label">No:</span>
                      <span className="value">8.1%</span>
                    </div>
                    <div className="stat">
                      <span className="label">Abstain:</span>
                      <span className="value">7.7%</span>
                    </div>
                  </div>
                  <div className="proposal-actions">
                    <button className="btn btn-secondary">View Results</button>
                  </div>
                </div>
              </div>
              
              <div className="governance-sidebar">
                <div className="governance-stats">
                  <h3>Governance Stats</h3>
                  <div className="stat-card">
                    <div className="stat-value">142</div>
                    <div className="stat-label">Total Proposals</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">3</div>
                    <div className="stat-label">Active Voting</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">89</div>
                    <div className="stat-label">Passed</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">12</div>
                    <div className="stat-label">Rejected</div>
                  </div>
                </div>
                
                <div className="create-proposal">
                  <h3>Create Proposal</h3>
                  <p>Submit a new governance proposal to the network.</p>
                  <button className="btn btn-primary">Create Proposal</button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'documentation' && (
          <div className="documentation-content">
            <h2>RPC Scanner Documentation</h2>
            <p>This tool helps you find the fastest RPC endpoints for Cosmos ecosystem chains.</p>
            <h3>How to use:</h3>
            <ol>
              <li>Select a chain from the dropdown menu</li>
              <li>Click "Search Endpoints" to scan available RPC endpoints</li>
              <li>Use the Staking Calculator to estimate rewards</li>
              <li>View detailed results and APR information</li>
            </ol>
            <h3>Features:</h3>
            <ul>
              <li>Real-time latency testing</li>
              <li>Provider information</li>
              <li>Online/Offline status detection</li>
              <li>Block height information</li>
              <li>Staking rewards calculation</li>
              <li>APR information for each chain</li>
              <li>Local database storage for offline access</li>
              <li>Auto-update every 24 hours</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// Main App component with routing
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/validators" element={<ValidatorPage />} />
        <Route path="/governance" element={<GovernmentPage />} />
      </Routes>
    </Router>
  )
}

export default App
