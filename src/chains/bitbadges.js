export const bitbadgesConfig = {
    chainId: 'bitbadges-1',
    chainName: 'BitBadges Mainnet',
    rpc: 'https://rpc-bitbadges.vinjan.xyz',
    rest: 'https://api-bitbadges.vinjan.xyz',
    bip44: {
        coinType: 118,
    },
    coinType: 118,
    bech32Config: {
        bech32PrefixAccAddr: 'bb',
        bech32PrefixAccPub: 'bbpub',
        bech32PrefixValAddr: 'bbvaloper',
        bech32PrefixValPub: 'bbvaloperpub',
        bech32PrefixConsAddr: 'bbvalcons',
        bech32PrefixConsPub: 'bbvalconspub',
    },
    currencies: [
        {
            coinDenom: 'BADGE',
            coinMinimalDenom: 'ubadge',
            coinDecimals: 9,
            coinGeckoId: 'unknown',
        },
    ],
    feeCurrencies: [
        {
            coinDenom: 'BADGE',
            coinMinimalDenom: 'ubadge',
            coinDecimals: 9,
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
        coinDenom: 'BADGE',
        coinMinimalDenom: 'ubadge',
        coinDecimals: 9,
        coinGeckoId: 'unknown',
    },
    features: [],
    explorer: 'https://explorer.catsmile.cloud/bitbadges-mainnet',
    logo: '/bitbadges.jpg',
    color: '#FF6B35'
};
