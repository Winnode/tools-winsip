export const empeiriConfig = {
    chainId: 'empe-testnet-2',
    chainName: 'Empeiria Testnet',
    rpc: 'https://empe-testnet-rpc.polkachu.com',
    rest: 'https://empe-testnet-api.polkachu.com',
    bip44: {
        coinType: 118,
    },
    coinType: 118,
    bech32Config: {
        bech32PrefixAccAddr: 'empe',
        bech32PrefixAccPub: 'empepub',
        bech32PrefixValAddr: 'empevaloper',
        bech32PrefixValPub: 'empevaloperpub',
        bech32PrefixConsAddr: 'empevalcons',
        bech32PrefixConsPub: 'empevalconspub',
    },
    currencies: [
        {
            coinDenom: 'EMPE',
            coinMinimalDenom: 'uempe',
            coinDecimals: 6,
            coinGeckoId: 'unknown',
        },
    ],
    feeCurrencies: [
        {
            coinDenom: 'EMPE',
            coinMinimalDenom: 'uempe',
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
        coinDenom: 'EMPE',
        coinMinimalDenom: 'uempe',
        coinDecimals: 6,
        coinGeckoId: 'unknown',
    },
    features: [],
    explorer: 'https://explorer.catsmile.cloud/empeiria-testnet',
    logo: '/Empeiria.jpg',
    color: '#8B5CF6'
};
