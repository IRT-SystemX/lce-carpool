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

export const enum TRANSACTION_STATUS {
    INSCRIPTION  = 'INSCRIPTION',
    CONFIRMATION = 'CONFIRMATION',
    REJECTION = 'REJECTION',
    PAYMENT = 'PAYMENT',
    TRIP_STARTED = 'TRIP_STARTED',
    TRIP_ENDED = 'TRIP_ENDED',
    BOOKING_CANCELLATION =  'BOOKING_CANCELLATION'}

export const enum OPERATORS {
    OP1 = 'op1',
    OP2 = 'op2'
}

export class Transaction {
    public docType?: string;
    public idTransaction?: string;
    public idTrip?: string;
    public idOffer: string;
    public idOperator: OPERATORS;
    public idPassenger: string;
    public idOperatorPassenger: string;
    public passengerShortname: string;
    public type: TRANSACTION_STATUS;
    public createdAt: number;

    // transaction validation schema
    public static TransactionYupSchema(): any {
        return Yup.object()
            .shape({
                idTransaction: Yup.string().notRequired(),
                idTrip: Yup.string().notRequired(),
                idOffer: Yup.string().required(),
                idOperator: Yup.string().required().oneOf([
                    OPERATORS.OP1,
                    OPERATORS.OP2
                ]),
                idPassenger: Yup.string().required(),
                idOperatorPassenger: Yup.string().required(),
                passengerShortname: Yup.string().required(),
                createdAt: Yup.number().integer().positive().required('Date as unix timestamp is required'),
                type: Yup.string().required().oneOf([
                    TRANSACTION_STATUS.INSCRIPTION,
                    TRANSACTION_STATUS.CONFIRMATION,
                    TRANSACTION_STATUS.REJECTION,
                    TRANSACTION_STATUS.PAYMENT,
                    TRANSACTION_STATUS.TRIP_STARTED,
                    TRANSACTION_STATUS.TRIP_ENDED,
                    TRANSACTION_STATUS.BOOKING_CANCELLATION
                ])
            });
    }
}
