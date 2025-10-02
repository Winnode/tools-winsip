export const paxiConfig = {
    chainId: 'paxi-mainnet',
    chainName: 'Paxi Mainnet',
    rpc: 'https://rpc.cosmos.directory/paxi',
    rest: 'https://rest.cosmos.directory/paxi',
    bip44: {
        coinType: 118,
    },
    coinType: 118,
    bech32Config: {
        bech32PrefixAccAddr: 'paxi',
        bech32PrefixAccPub: 'paxipub',
        bech32PrefixValAddr: 'paxivaloper',
        bech32PrefixValPub: 'paxivaloperpub',
        bech32PrefixConsAddr: 'paxivalcons',
        bech32PrefixConsPub: 'paxivalconspub',
    },
    currencies: [
        {
            coinDenom: 'PAXI',
            coinMinimalDenom: 'upaxi',
            coinDecimals: 6,
            coinGeckoId: 'unknown',
        },
    ],
    feeCurrencies: [
        {
            coinDenom: 'PAXI',
            coinMinimalDenom: 'upaxi',
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
        coinDenom: 'PAXI',
        coinMinimalDenom: 'upaxi',
        coinDecimals: 6,
        coinGeckoId: 'unknown',
    },
    features: [],
    explorer: 'https://explorer.catsmile.cloud/paxi-mainnet',
    logo: '/paxi.jpg',
    color: '#10B981'
};
