export const cnhoConfig = {
    chainId: 'cnho_stables-1',
    chainName: 'CNHO Mainnet',
    rpc: 'https://rpc.cnho.io',
    rest: 'https://api.cnho.io',
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
            coinDenom: 'CNHO',
            coinMinimalDenom: 'ucnho',
            coinDecimals: 6,
            coinGeckoId: 'unknown',
        },
    ],
    feeCurrencies: [
        {
            coinDenom: 'CNHO',
            coinMinimalDenom: 'ucnho',
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
        coinDenom: 'CNHO',
        coinMinimalDenom: 'ucnho',
        coinDecimals: 6,
        coinGeckoId: 'unknown',
    },
    features: [],
    explorer: 'https://explorer.catsmile.cloud/cnho-mainnet',
    logo: '/cnho.jpg',
    color: '#4CAF50'
};
