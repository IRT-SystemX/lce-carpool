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

import {ChaincodeError, StubHelper, Helpers} from '@theledger/fabric-chaincode-utils';
import * as Yup from 'yup';
import * as _ from 'lodash';

export const enum OPERATORS {
  OP1 = 'op1',
  OP2 = 'op2'
}

export const enum TRANSACTION_STATUS {
  INSCRIPTION = 'INSCRIPTION',
  CONFIRMATION = 'CONFIRMATION',
  TRIP_STARTED = 'TRIP_STARTED',
  TRIP_ENDED = 'TRIP_ENDED'
}

export const enum ROLES {
  DRIVER = 'driver',
  PASSENGER = 'passenger',
}

export class Utils {
  
  public static getInvokerOperator(stubHelper: StubHelper): string {
    let cid = stubHelper.getClientIdentity();
    return cid.getAttributeValue('operator');
  }

  /**
   * Check if the invoker is the owner of the asset
   * @param {StubHelper} stubHelper
   * @param {string} idOperator
   * @param logger
   */
  public static checkIsOwner(stubHelper: StubHelper, idOperator: string, logger: any): boolean {
    // TODO fix the probleme of not owner
    return true;
    // let cid = stubHelper.getClientIdentity();
    // const checked = cid.assertAttributeValue('operator', idOperator);
    // if(!checked) {
    //     logger.debug(`${cid.getX509Certificate()}`);
    //     logger.debug(`${cid.getID()}`);
    //     logger.debug(`Received ID attributes: ${cid.getAttributeValue('operator')} for offerOperator ${idOperator}`);
    // }
    //
    // return checked;
  }

    public static async invokeChaincode(stubHelper: StubHelper, chaincodeName: string, functionName: string,
                                        args: any = undefined, channel: any = undefined, logger: any) {

        await Helpers.checkArgs<{ chaincodeName: string, functionName: string }>(
            {chaincodeName, functionName},
            Yup.object().shape({
                chaincodeName: Yup.string().required(),
                functionName: Yup.string().required(),
            }));

        let invokeArgs = [functionName];
        if (_.isArray(args)) {
            invokeArgs = invokeArgs.concat(args.map((a) => {
                if (!_.isString(a)) {
                    return JSON.stringify(a);
                }
                return a;
            }));
        }

        return new Promise((fulfill, reject) => {
            // do this in a timeout to make sure the txId
            // is released when another chaincode is invoked before.
            // @ref https://jira.hyperledger.org/browse/FAB-7437
            setTimeout(async () => {
                const stub = stubHelper.getStub();
                const invokeChannel = channel || stub.getChannelID();

                try {
                    const invokeResult = await stub.invokeChaincode(chaincodeName, invokeArgs, invokeChannel);

                    if (invokeResult == null || invokeResult.status !== 200) {
                        throw new ChaincodeError(
                            `invoke chaincode error (chaincodeName: ${chaincodeName}, args: ${invokeArgs},
                            channel: ${invokeChannel}, status: ${invokeResult ? invokeResult.status : undefined},
                            payload: ${invokeResult ? invokeResult.payload : undefined}`);
                    }

                    const payload = invokeResult.payload.toString('utf8');
                    let invokeResponse = null;
                    try {
                        invokeResponse = JSON.parse(payload);
                    } catch (e) {
                        // Not a json object
                        invokeResponse = payload;
                    }

                    fulfill(invokeResponse);
                } catch (error) {
                    let ccError;

                    if (error instanceof ChaincodeError) {
                        ccError = error;
                    } else {
                        logger.error(`Error while calling ${chaincodeName} with args ${args} on channel ${invokeChannel}`);

                        const errorData = Utils.parseErrorMessage(error.message, logger);
                        if (_.isUndefined(errorData.key)) {
                            ccError = new ChaincodeError(`chaincode_invoke_error: {message: ${error.message}}`);
                        } else {
                            ccError = new ChaincodeError(`${errorData.key}, ${errorData.data}, ${errorData.stack}`);
                        }
                    }
                    reject(ccError);
                }
            }, 100);
        });
    }

    public static parseErrorMessage(message: string, logger: any) {
        const INVOKE_REGEX = /^.*?Calling\s+chaincode\s+Invoke\(\)\s+returned\s+error\s+response\s+(.*)\..*?$/i;

        try {
            if (INVOKE_REGEX.test(message)) {
                const match = message.match(INVOKE_REGEX)[1];
                const errorResponse = JSON.parse(match);
                return Array.isArray(errorResponse) ? errorResponse[0] : errorResponse;
            }
        } catch (e) {
            logger.error(`Unable to parse error details from error: ${message}.`);
        }

        return message;
    }

  public static async getPublicKey(stubHelper: StubHelper, logger: any) {
    const idOperator = this.getInvokerOperator(stubHelper);

    const invokeResult: any = await this.invokeChaincode(
      stubHelper,
      'kms',
      'getKeysById',
      [{ idOperator }],
      'mychannel',
      logger);

    if (!invokeResult.hasOwnProperty('kms')) { 
        throw new ChaincodeError('Public key not found', 500);
    }

    return invokeResult.kms.publicKey ;
  }

  public static async getPrivateKey(stubHelper: StubHelper, logger: any) {
      const idOperator = this.getInvokerOperator(stubHelper);

      const invokeResult: any = await this.invokeChaincode(
        stubHelper,
        'kms',
        'getKeysById',
        [{ idOperator }],
        'mychannel',
        logger);

        if (!invokeResult.hasOwnProperty('kmsPrivate')) { 
            throw new ChaincodeError('Private key not found', 500);
        }

      return invokeResult.kmsPrivate.privateKey ;
  }
}
