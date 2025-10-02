export const wardenConfig = {
    chainId: 'barra_9191-1',
    chainName: 'Warden Testnet',
    rpc: 'https://warden-testnet-rpc.itrocket.net',
    rest: 'https://warden-testnet-api.itrocket.net',
    bip44: {
        coinType: 118,
    },
    coinType: 118,
    bech32Config: {
        bech32PrefixAccAddr: 'warden',
        bech32PrefixAccPub: 'wardenpub',
        bech32PrefixValAddr: 'wardenvaloper',
        bech32PrefixValPub: 'wardenvaloperpub',
        bech32PrefixConsAddr: 'wardenvalcons',
        bech32PrefixConsPub: 'wardenvalconspub',
    },
    currencies: [
        {
            coinDenom: 'WARD',
            coinMinimalDenom: 'award',
            coinDecimals: 18,
            coinGeckoId: 'unknown',
        },
    ],
    feeCurrencies: [
        {
            coinDenom: 'WARD',
            coinMinimalDenom: 'award',
            coinDecimals: 18,
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
        coinDenom: 'WARD',
        coinMinimalDenom: 'award',
        coinDecimals: 18,
        coinGeckoId: 'unknown',
    },
    features: ['eth-address-gen', 'eth-key-sign'],
    explorer: 'https://explorer.catsmile.cloud/warden-testnet',
    logo: '/Warden.jpg',
    color: '#7C3AED'
};
