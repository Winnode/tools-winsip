import { SigningStargateClient } from '@cosmjs/stargate';

export const redelegateOperation = {
    title: 'Redelegate',
    icon: '🔄',
    description: 'Move delegation from one validator to another',
    
    getForm: (currentValidator = '', stakedAmount = '0') => `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">From Validator</label>
                <input type="text" id="redelegate-from" value="${currentValidator}" class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400" placeholder="Current validator address">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">To Validator</label>
                <input type="text" id="redelegate-to" class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400" placeholder="New validator address">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                <input type="number" id="redelegate-amount" class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400" placeholder="Enter amount to redelegate">
                <p class="text-xs text-gray-400 mt-1">Staked: ${stakedAmount}</p>
            </div>
            <button id="execute-redelegate" class="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
                Redelegate Tokens
            </button>
        </div>
    `,
    
    execute: async (chainConfig, signer, walletAddress) => {
        const fromValidator = document.getElementById('redelegate-from').value;
        const toValidator = document.getElementById('redelegate-to').value;
        const amount = document.getElementById('redelegate-amount').value;
        
        if (!fromValidator || !toValidator || !amount) {
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
            typeUrl: "/cosmos.staking.v1beta1.MsgBeginRedelegate",
            value: {
                delegatorAddress: walletAddress,
                validatorSrcAddress: fromValidator,
                validatorDstAddress: toValidator,
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
            message: `Successfully redelegated ${amount} tokens`
        };
    }
};