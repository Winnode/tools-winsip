import { SigningStargateClient } from '@cosmjs/stargate';

export const voteOperation = {
    title: 'Vote on Proposal',
    icon: '🗳️',
    description: 'Vote on governance proposals',
    
    getForm: (proposalId = '', proposalTitle = '') => `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Proposal ID</label>
                <input type="number" id="vote-proposal" value="${proposalId}" class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400" placeholder="Enter proposal ID">
            </div>
            ${proposalTitle ? `
            <div class="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
                <p class="text-blue-300 text-sm font-medium">Proposal: ${proposalTitle}</p>
            </div>
            ` : ''}
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Vote Option</label>
                <select id="vote-option" class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white">
                    <option value="">Select vote option</option>
                    <option value="VOTE_OPTION_YES">Yes</option>
                    <option value="VOTE_OPTION_NO">No</option>
                    <option value="VOTE_OPTION_ABSTAIN">Abstain</option>
                    <option value="VOTE_OPTION_NO_WITH_VETO">No With Veto</option>
                </select>
            </div>
            <button id="execute-vote" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors">
                Submit Vote
            </button>
        </div>
    `,
    
    execute: async (chainConfig, signer, walletAddress) => {
        const proposalId = document.getElementById('vote-proposal').value;
        const voteOption = document.getElementById('vote-option').value;
        
        if (!proposalId || !voteOption) {
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
            typeUrl: "/cosmos.gov.v1beta1.MsgVote",
            value: {
                proposalId: proposalId,
                voter: walletAddress,
                option: voteOption
            }
        };
        
        const result = await client.signAndBroadcast(walletAddress, [msg], fee);
        
        return {
            success: true,
            txHash: result.transactionHash,
            message: `Successfully voted ${voteOption} on proposal ${proposalId}`
        };
    }
};