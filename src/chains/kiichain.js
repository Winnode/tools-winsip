export const kiichainConfig = {
    chainId: 'oro_1336-1',
    chainName: 'Kiichain Testnet',
    rpc: 'https://rpc.uno.sentry.testnet.v3.kiivalidator.com',
    rest: 'https://lcd.uno.sentry.testnet.v3.kiivalidator.com',
    bip44: {
        coinType: 60,
    },
    coinType: 60,
    bech32Config: {
        bech32PrefixAccAddr: 'kii',
        bech32PrefixAccPub: 'kiipub',
        bech32PrefixValAddr: 'kiivaloper',
        bech32PrefixValPub: 'kiivaloperpub',
        bech32PrefixConsAddr: 'kiivalcons',
        bech32PrefixConsPub: 'kiivalconspub',
    },
    currencies: [
        {
            coinDenom: 'KII',
            coinMinimalDenom: 'akii',
            coinDecimals: 18,
            coinGeckoId: 'kii',
        },
    ],
    feeCurrencies: [
        {
            coinDenom: 'KII',
            coinMinimalDenom: 'akii',
            coinDecimals: 18,
            coinGeckoId: 'kii',
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
        coinDenom: 'KII',
        coinMinimalDenom: 'akii',
        coinDecimals: 18,
        coinGeckoId: 'kii',
    },
    features: [],
    explorer: 'https://explorer.catsmile.cloud/kiichain-testnet',
    logo: '/kiichain.jpg',
    color: '#F59E0B'
};
