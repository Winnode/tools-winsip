import { SigningStargateClient } from '@cosmjs/stargate';

export const delegateOperation = {
    title: 'Delegate',
    icon: '🤝',
    description: 'Delegate tokens to a validator',
    
    getForm: (validatorAddress = '', balance = '0') => `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Validator Address</label>
                <input type="text" id="delegate-validator" value="${validatorAddress}" class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400" placeholder="Enter validator address">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                <input type="number" id="delegate-amount" class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400" placeholder="Enter amount to delegate">
                <p class="text-xs text-gray-400 mt-1">Available: ${balance}</p>
            </div>
            <button id="execute-delegate" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                Delegate Tokens
            </button>
        </div>
    `,
    
    execute: async (chainConfig, signer, walletAddress) => {
        const validatorAddress = document.getElementById('delegate-validator').value;
        const amount = document.getElementById('delegate-amount').value;
        
        if (!validatorAddress || !amount) {
            throw new Error('Please fill all fields');
        }
        
        const client = await SigningStargateClient.connectWithSigner(chainConfig.rpc, signer, {
            prefix: chainConfig.bech32Config.bech32PrefixAccAddr
        });
        
        const fee = {
            amount: [{
                denom: chainConfig.stakeCurrency.coinMinimalDenom,
                amount: "5000"
            }],
            gas: "200000"
        };
        
        const msg = {
            typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
            value: {
                delegatorAddress: walletAddress,
                validatorAddress: validatorAddress,
                amount: {
                    denom: chainConfig.stakeCurrency.coinMinimalDenom,
                    amount: (parseFloat(amount) * Math.pow(10, chainConfig.stakeCurrency.coinDecimals)).toString()
                }
            }
        };
        
        const result = await client.signAndBroadcast(walletAddress, [msg], fee);
        
        return {
            success: true,
            txHash: result.transactionHash,
            message: `Successfully delegated ${amount} tokens`
        };
    }
};