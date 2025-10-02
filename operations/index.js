// Operations index
import { unjailOperation } from './unjail.js'
import { claimOperation } from './claim.js'
import { delegateOperation } from './delegate.js'
import { redelegateOperation } from './redelegate.js'
import { sendOperation } from './send.js'
import { unbondOperation } from './unbond.js'
import { voteOperation } from './vote.js'

export const OPERATIONS = {
  unjail: unjailOperation,
  claim: claimOperation,
  delegate: delegateOperation,
  redelegate: redelegateOperation,
  send: sendOperation,
  unbond: unbondOperation,
  vote: voteOperation
}

export {
  unjailOperation,
  claimOperation,
  delegateOperation,
  redelegateOperation,
  sendOperation,
  unbondOperation,
  voteOperation
}