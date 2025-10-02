export const lumeraTestnetConfig = {
    chainId: 'lumera-testnet-2',
    chainName: 'Lumera Testnet',
    rpc: 'https://lumera-testnet-rpc.polkachu.com',
    rest: 'https://lumera-testnet-api.polkachu.com',
    bip44: {
        coinType: 118,
    },
    coinType: 118,
    bech32Config: {
        bech32PrefixAccAddr: 'lumera',
        bech32PrefixAccPub: 'lumerapub',
        bech32PrefixValAddr: 'lumeravaloper',
        bech32PrefixValPub: 'lumeravaloperpub',
        bech32PrefixConsAddr: 'lumeravalcons',
        bech32PrefixConsPub: 'lumeravalconspub',
    },
    currencies: [
        {
            coinDenom: 'LUME',
            coinMinimalDenom: 'ulume',
            coinDecimals: 6,
            coinGeckoId: 'unknown',
        },
    ],
    feeCurrencies: [
        {
            coinDenom: 'LUME',
            coinMinimalDenom: 'ulume',
            coinDecimals: 6,
            coinGeckoId: 'unknown',
            gasPriceStep: {
                low: 0.01,
                average: 0.025,
                high: 0.03,
            },
        },
    ],
    gasPriceStep: {
        low: 0.01,
        average: 0.025,
        high: 0.03,
    },
    stakeCurrency: {
        coinDenom: 'LUME',
        coinMinimalDenom: 'ulume',
        coinDecimals: 6,
        coinGeckoId: 'unknown',
    },
    features: [],
    explorer: 'https://explorer.catsmile.cloud/lumera-test',
    logo: '/lumera.png',
    color: '#00D4FF'
};

export const lumeraMainnetConfig = {
    chainId: 'lumera-mainnet-1',
    chainName: 'Lumera Mainnet',
    rpc: 'https://lumera-rpc.polkachu.com',
    rest: 'https://lumera-api.polkachu.com',
    bip44: {
        coinType: 118,
    },
    coinType: 118,
    bech32Config: {
        bech32PrefixAccAddr: 'lumera',
        bech32PrefixAccPub: 'lumerapub',
        bech32PrefixValAddr: 'lumeravaloper',
        bech32PrefixValPub: 'lumeravaloperpub',
        bech32PrefixConsAddr: 'lumeravalcons',
        bech32PrefixConsPub: 'lumeravalconspub',
    },
    currencies: [
        {
            coinDenom: 'LUME',
            coinMinimalDenom: 'ulume',
            coinDecimals: 6,
            coinGeckoId: 'unknown',
        },
    ],
    feeCurrencies: [
        {
            coinDenom: 'LUME',
            coinMinimalDenom: 'ulume',
            coinDecimals: 6,
            coinGeckoId: 'unknown',
            gasPriceStep: {
                low: 0.01,
                average: 0.025,
                high: 0.03,
            },
        },
    ],
    gasPriceStep: {
        low: 0.01,
        average: 0.025,
        high: 0.03,
    },
    stakeCurrency: {
        coinDenom: 'LUME',
        coinMinimalDenom: 'ulume',
        coinDecimals: 6,
        coinGeckoId: 'unknown',
    },
    features: [],
    explorer: 'https://explorer.catsmile.cloud/lumera-mainnet',
    logo: '/lumera.png',
    color: '#00D4FF'
};