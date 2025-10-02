import { SigningStargateClient } from '@cosmjs/stargate';

export const sendOperation = {
    title: 'Send Tokens',
    icon: '💸',
    description: 'Send tokens to another address',
    
    getForm: (balance = '0') => `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Recipient Address</label>
                <input type="text" id="send-recipient" class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400" placeholder="Enter recipient address">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                <input type="number" id="send-amount" class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400" placeholder="Enter amount to send">
                <p class="text-xs text-gray-400 mt-1">Available: ${balance}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Memo (Optional)</label>
                <input type="text" id="send-memo" class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400" placeholder="Enter memo">
            </div>
            <button id="execute-send" class="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors">
                Send Tokens
            </button>
        </div>
    `,
    
    execute: async (chainConfig, signer, walletAddress) => {
        const recipient = document.getElementById('send-recipient').value;
        const amount = document.getElementById('send-amount').value;
        const memo = document.getElementById('send-memo').value || '';
        
        if (!recipient || !amount) {
            throw new Error('Please fill recipient and amount fields');
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
            typeUrl: "/cosmos.bank.v1beta1.MsgSend",
            value: {
                fromAddress: walletAddress,
                toAddress: recipient,
                amount: [{
                    denom: chainConfig.stakeCurrency.coinMinimalDenom,
                    amount: (parseFloat(amount) * Math.pow(10, chainConfig.stakeCurrency.coinDecimals)).toString()
                }]
            }
        };
        
        const result = await client.signAndBroadcast(walletAddress, [msg], fee, memo);
        
        return {
            success: true,
            txHash: result.transactionHash,
            message: `Successfully sent ${amount} tokens to ${recipient}`
        };
    }
};