import { SigningStargateClient } from '@cosmjs/stargate';

export const unbondOperation = {
    title: 'Unbond',
    icon: '📤',
    description: 'Unbond tokens from a validator',
    
    getForm: (validatorAddress = '', stakedAmount = '0') => `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Validator Address</label>
                <input type="text" id="unbond-validator" value="${validatorAddress}" class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400" placeholder="Enter validator address">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                <input type="number" id="unbond-amount" class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400" placeholder="Enter amount to unbond">
                <p class="text-xs text-gray-400 mt-1">Staked: ${stakedAmount}</p>
            </div>
            <div class="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                <p class="text-yellow-300 text-sm">⚠️ Unbonding takes 21 days during which tokens cannot be transferred or used for staking.</p>
            </div>
            <button id="execute-unbond" class="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors">
                Unbond Tokens
            </button>
        </div>
    `,
    
    execute: async (chainConfig, signer, walletAddress) => {
        const validatorAddress = document.getElementById('unbond-validator').value;
        const amount = document.getElementById('unbond-amount').value;
        
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
            typeUrl: "/cosmos.staking.v1beta1.MsgUndelegate",
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
            message: `Successfully unbonded ${amount} tokens from validator`
        };
    }
};