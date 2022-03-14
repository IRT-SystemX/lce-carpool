const JwtInfo = {
  REQUEST_TOKEN_NOT_FOUND : 'user token credential not found',
  ERROR_USER_DIFF_OPERATOR: 'Existing user with different operator'
    
};

const OfferMsg = {
  OFFER_POST_SUCCESSFULLY: 'Offer created successfully',
  OFFER_POST_SUCCESSFULLY_WITH_MISSING: 'Offer created successfully. Please note the following offers are incorrect ',
  OFFER_PATCH_SUCCESSFULLY: 'Offer available seats updated successfully',

  OFFER_GET_ID_NOT_EXIST: "Offer does not exist",
  OFFER_GET_NO_OFFER_FOUND: "No offer found",
  OFFER_POST_WRONG_OPERATOR: 'You are not authorized to post the offer (not same operator ID)',
  OFFER_PATCH_WRONG_OPERATOR: 'You are not authorized to update the offer (not same operator ID)',
};

const TransactionMsg = {
  OFFER_POST_SUCCESSFULLY: 'Transaction created successfully',

  TRANSACTION_GET_ID_NOT_EXIST: 'Transaction does not exist',
  TRANSACTION_OFFER_NOT_EXIST: 'Offer for the transaction does not exist',
};

const MessageMsg = {
  MESSAGE_POST_SUCCESSFULLY: 'message delivered successfully',
  MESSAGE_UPDATED_SUCCESSFULLY: 'message status updated successfully',
  MESSAGE_UPDATED_NO_CONTENT: 'No message found to update',
}

const ProofMsg = {
  PROOF_PATCH_SUCCESSFULLY: 'Proof upgraded successfully',

  PROOF_POST_ERROR: 'An error occured: idOperator is invalid or offer does not exist.',
  PROOF_GET_NO_PROOF_FOUND: 'No proof found',
  PROOF_OFFER_NOT_EXIST: 'Offer for the proof does not exist',
  PROOF_PATCH_NO_TRANSACTION_FOUND: 'Proof can\'t be upgraded: Transaction does not exist',
  PROOF_PATCH_WRONG_OPERATOR: 'You are not authorized to upgrade the proof (not valid operator ID)',
  PROOF_PATCH_WRONG_TYPE: 'You are not authorized to upgrade the proof (not valid transaction type)',
}

const KmsMsg = {
  KEY_GEN_OPERATOR_POST_SUCCESSFULLY: 'Success',
}


module.exports = {
  JwtInfo,
  OfferMsg,
  TransactionMsg,
  MessageMsg,
  ProofMsg,
  KmsMsg
};