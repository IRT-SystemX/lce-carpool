/*
 * Ledger Carpool Exchange (LCE) - A blockchain based carpooling interoperability platform
 * Copyright (C) 2018 - 2021 IRT SystemX - Métropole de Lyon - Coopgo
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const HlfErrors = {
  NO_ENROLLED_USER: 'User not defined, or not enrolled. Or network is down',
  BAD_TRANSACTION_PROPOSAL: 'Transaction proposal was bad',
  TRANSACTION_TIMED_OUT: 'The transaction has timed out: %s',
  INVALID_TRANSACTION: 'The transaction was invalid, code: %s',
  FAILED_TO_SEND_TX: 'Failed to send transaction and get notifications within the timeout period: %s',
  FAILED_TO_SEND_PROPOSAL: 'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...',
  FAILED_TO_ENROLL_ADMIN: 'Failed to enroll admin: %s',
  ERROR_STARTING_HLF: 'Error occurred during connection hlf: %s',
  FAILED_TO_REGISTER: 'Failed to register: %s',
  FAILED_TO_REGISTER_DIFFERENT_OPERATOR: 'Existing user %s with different operator %s',
  NO_ADMIN_USER: 'No Admin user present',
  // tslint:disable-next-line:max-line-length
  AUTH_FAILURES: 'Authorization failures may be caused by having admin credentials from a previous CA instance.\n Try again after deleting the contents of the store directory ',
};

const HlfInfo = {
  CREATING_CLIENT: 'Creating client and setting the wallet location...',
  CHECK_USER_ENROLLED: 'Checking if user is enrolled...',
  USER_ENROLLED: 'User is enrolled: %s',
  USER_REGISTERED: 'User is registered: %s',
  MAKE_QUERY: 'Making query:',
  MAKE_INVOKE: 'Invoking chaincode:',
  INIT_SUCCESS: 'Successfully instantiated HLF Client',
  ASSIGNING_TRANSACTION_ID: 'Assigning transaction_id: %s',
  NO_PAYLOADS_RETURNED: 'No payloads were returned from query',
  PAYLOAD_RESULT_COUNT: 'Query result count: %s',
  SET_WALLET_PATH: 'Setting wallet path, and associating user %s with application...',
  WALLET_PATH: 'WALLET PATH: %s',
  WALLET: 'WALLET: %s',
  GOOD_TRANSACTION_PROPOSAL: 'Transaction proposal was good',
  RESPONSE_IS: 'Response is %s',
  SUCCESFULLY_SENT_PROPOSAL: 'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s"',
  COMMITTED_ON_PEER: 'The transaction has been committed on peer %s',
  SUCCESSSFULLY_SENT_TO_ORDERER: 'Successfully sent transaction to the orderer.',
  EVENT_PROMISES_COMPLETE: 'Event promises complete and testing complete',
  CHECK_TRANSACTION_PROPOSAL: 'Checking if transaction proposal is good...',
  REGISTERING_TRANSACTION_EVENT: 'Registering transaction event...',
  CONNECTING_EVENTHUB: 'Connecting eventhub...',
  ASSIGNED_ADMIN: 'Assigned the admin user to the fabric client',
};

module.exports = {
  HlfErrors,
  HlfInfo
};
