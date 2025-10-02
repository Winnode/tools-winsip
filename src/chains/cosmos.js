export const cosmosConfig = {
    chainId: 'cosmoshub-4',
    chainName: 'Cosmos Hub',
    rpc: 'https://cosmos-rpc.polkachu.com',
    rest: 'https://rest.cosmos.directory/cosmoshub',
    bip44: {
        coinType: 118,
    },
    coinType: 118,
    bech32Config: {
        bech32PrefixAccAddr: 'cosmos',
        bech32PrefixAccPub: 'cosmospub',
        bech32PrefixValAddr: 'cosmosvaloper',
        bech32PrefixValPub: 'cosmosvaloperpub',
        bech32PrefixConsAddr: 'cosmosvalcons',
        bech32PrefixConsPub: 'cosmosvalconspub',
    },
    currencies: [
        {
            coinDenom: 'ATOM',
            coinMinimalDenom: 'uatom',
            coinDecimals: 6,
            coinGeckoId: 'cosmos',
        },
    ],
    feeCurrencies: [
        {
            coinDenom: 'ATOM',
            coinMinimalDenom: 'uatom',
            coinDecimals: 6,
            coinGeckoId: 'cosmos',
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
        coinDenom: 'ATOM',
        coinMinimalDenom: 'uatom',
        coinDecimals: 6,
        coinGeckoId: 'cosmos',
    },
    features: [],
    explorer: 'https://www.mintscan.io/cosmos',
    logo: '/cosmos.svg',
    color: '#6C63FF'
};