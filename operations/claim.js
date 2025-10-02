import { SigningStargateClient } from '@cosmjs/stargate';

export const claimOperation = {
    title: 'Claim Rewards',
    icon: '💰', 
    description: 'Claim staking rewards from validators',
    
    getForm: (rewards = '0') => `
        <div class="space-y-4">
            <div class="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
                <p class="text-blue-300 text-sm">Available Rewards: ${rewards}</p>
            </div>
            <button id="execute-claim" class="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors">
                Claim All Rewards
            </button>
        </div>
    `,
    
    execute: async (chainConfig, signer, walletAddress) => {
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
            typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
            value: {
                delegatorAddress: walletAddress,
                validatorAddress: "validator_address" // This should be dynamic
            }
        };
        
        const result = await client.signAndBroadcast(walletAddress, [msg], fee);
        
        return {
            success: true,
            txHash: result.transactionHash,
            message: 'Successfully claimed rewards'
        };
    }
};