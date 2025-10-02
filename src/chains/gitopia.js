export const gitopiaConfig = {
    chainId: 'gitopia',
    chainName: 'Gitopia Mainnet',
    rpc: 'https://gitopia-rpc.polkachu.com/',
    rest: 'https://gitopia-api.polkachu.com/',
    bip44: {
        coinType: 60,
    },
    coinType: 60,
    bech32Config: {
        bech32PrefixAccAddr: 'lore',
        bech32PrefixAccPub: 'lorepub',
        bech32PrefixValAddr: 'lorevaloper',
        bech32PrefixValPub: 'lorevaloperpub',
        bech32PrefixConsAddr: 'lorevalcons',
        bech32PrefixConsPub: 'lorevalconspub',
    },
    currencies: [
        {
            coinDenom: 'LORE',
            coinMinimalDenom: 'ulore',
            coinDecimals: 6,
            coinGeckoId: 'unknown',
        },
    ],
    feeCurrencies: [
        {
            coinDenom: 'LORE',
            coinMinimalDenom: 'ulore',
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
        coinDenom: 'LORE',
        coinMinimalDenom: 'ulore',
        coinDecimals: 6,
        coinGeckoId: 'unknown',
    },
    features: [],
    explorer: 'https://explorer.catsmile.cloud/gitopia-mainnet',
    logo: '/Gitopia.png',
    color: '#FF6B35'
};
