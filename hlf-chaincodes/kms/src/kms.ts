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

/* tslint:disable */
import * as Yup from 'yup';
import { OPERATORS } from './utils';

export class Kms {
    public docType?: string;
    public idOperator: string;
    public publicKey: string;

    // Store operator keys public and private keys in the blockchain
    public static CreateKeysYupSchema(): any {
        return Yup.object()
            .shape({
                idOperator: Yup.string().required().oneOf([
                    OPERATORS.OP1,
                    OPERATORS.OP2,
                ]),
                publicKey: Yup.string().required(),
            });
    }

    // request to send re-encryption key to the proxy
    public static CreateRekeyYupSchema(): any {
        return Yup.object()
            .shape({
                idOperatorDelegator: Yup.string().required().oneOf([
                    OPERATORS.OP1,
                    OPERATORS.OP2,
                ]),
                idOperatorDelegatee: Yup.string().required().oneOf([
                    OPERATORS.OP1,
                    OPERATORS.OP2,
                ]),
                reKey: Yup.string().required(),
            });
    }
}
