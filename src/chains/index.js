// Chain configurations for supported networks
import { lumeraTestnetConfig, lumeraMainnetConfig } from './lumera.js'
import { cosmosConfig } from './cosmos.js'
import { gitopiaConfig } from './gitopia.js'
import { bitbadgesConfig } from './bitbadges.js'
import { wardenConfig } from './warden.js'
import { kiichainConfig } from './kiichain.js'
import { empeiriConfig } from './empeiria.js'
import { paxiConfig } from './paxi.js'
import { safroConfig } from './safro.js'
import { tellorConfig } from './tellor.js'
import { cnhoConfig } from './cnho.js'

export const SUPPORTED_CHAINS = {
    'lumera-testnet': lumeraTestnetConfig,
    'lumera-mainnet': lumeraMainnetConfig,
    'cosmos': cosmosConfig,
    'gitopia': gitopiaConfig,
    'bitbadges': bitbadgesConfig,
    'warden': wardenConfig,
    'kiichain': kiichainConfig,
    'empeiria': empeiriConfig,
    'paxi': paxiConfig,
    'safro': safroConfig,
    'tellor': tellorConfig,
    'cnho': cnhoConfig
}

export const getAllChains = () => {
    return Object.entries(SUPPORTED_CHAINS).map(([key, config]) => ({
        key,
        ...config
    }))
}

export const getChainConfig = (chainKey) => {
    return SUPPORTED_CHAINS[chainKey] || null
}

export const getChainByChainId = (chainId) => {
    return Object.values(SUPPORTED_CHAINS).find(config => config.chainId === chainId) || null
}
