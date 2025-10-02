export const safroConfig = {
    chainId: 'safro-testnet-1',
    chainName: 'Safro Testnet',
    rpc: 'https://rpc.testnet.safrochain.com',
    rest: 'https://rest.testnet.safrochain.com',
    bip44: {
        coinType: 118,
    },
    coinType: 118,
    bech32Config: {
        bech32PrefixAccAddr: 'addr_safro',
        bech32PrefixAccPub: 'addr_safropub',
        bech32PrefixValAddr: 'addr_safrovaloper',
        bech32PrefixValPub: 'addr_safrovaloperpub',
        bech32PrefixConsAddr: 'addr_safrovalcons',
        bech32PrefixConsPub: 'addr_safrovalconspub',
    },
    currencies: [
        {
            coinDenom: 'usaf',
            coinMinimalDenom: 'SAF',
            coinDecimals: 6,
            coinGeckoId: 'unknown',
        },
    ],
    feeCurrencies: [
        {
            coinDenom: 'usaf',
            coinMinimalDenom: 'SAF',
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
        coinDenom: 'usaf',
        coinMinimalDenom: 'SAF',
        coinDecimals: 6,
        coinGeckoId: 'unknown',
    },
    features: [],
    explorer: 'https://explorer.catsmile.cloud/safro-testnet',
    logo: '/safrochain.jpg',
    color: '#FF6B35'
};
