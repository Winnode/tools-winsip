import { SigningStargateClient } from '@cosmjs/stargate';
import { Registry } from '@cosmjs/proto-signing';
import { MsgUnjail } from 'cosmjs-types/cosmos/slashing/v1beta1/tx';

export const unjailOperation = {
    title: 'Unjail Validator',
    icon: '🔑',
    description: 'Unjail a validator that has been jailed',
    
    getForm: (validatorAddress = '', isJailed = false) => `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Validator Address</label>
                <input type="text" id="unjail-validator" value="${validatorAddress}" class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400" placeholder="Enter validator address">
            </div>
            <div class="bg-red-900/20 border border-red-600/30 rounded-lg p-3">
                <p class="text-red-300 text-sm">⚠️ This operation can only be performed by the validator operator. Make sure you are using the correct validator address.</p>
            </div>
            ${!isJailed ? `
            <div class="bg-green-900/20 border border-green-600/30 rounded-lg p-3">
                <p class="text-green-300 text-sm">✅ Validator is not jailed. Unjail operation is not needed.</p>
            </div>
            ` : ''}
            <button id="execute-unjail" class="w-full py-3 ${isJailed ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 cursor-not-allowed'} text-white font-semibold rounded-lg transition-colors" ${!isJailed ? 'disabled' : ''}>
                ${isJailed ? 'Unjail Validator' : 'Validator Not Jailed'}
            </button>
        </div>
    `,
    
    execute: async (chainConfig, signer, walletAddress, validatorAddress) => {
        if (!validatorAddress) {
            throw new Error('Validator address is required');
        }
        
        // Create registry with MsgUnjail type
        const registry = new Registry();
        registry.register("/cosmos.slashing.v1beta1.MsgUnjail", MsgUnjail);
        
        const client = await SigningStargateClient.connectWithSigner(chainConfig.rpc, signer, {
            prefix: chainConfig.bech32Config.bech32PrefixAccAddr,
            registry: registry
        });
        
        const fee = {
            amount: [{
                denom: chainConfig.currencies[0].coinMinimalDenom,
                amount: "5000"
            }],
            gas: "200000"
        };
        
        // Format message untuk unjail
        const msg = {
            typeUrl: "/cosmos.slashing.v1beta1.MsgUnjail",
            value: MsgUnjail.fromPartial({
                validatorAddr: validatorAddress
            })
        };
        
        const result = await client.signAndBroadcast(walletAddress, [msg], fee);
        
        return {
            success: true,
            txHash: result.transactionHash,
            message: `Successfully unjailed validator ${validatorAddress}`
        };
    }
};
