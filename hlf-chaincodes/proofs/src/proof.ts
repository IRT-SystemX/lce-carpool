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
import { OPERATORS, TRANSACTION_STATUS, ROLES } from './utils';

export class Proof {
    public docType?: string;
    public idProof?: string;
    public idTrip?: string;
    public idOffer: string;
    public idOperator: OPERATORS;
    public idUser: string;
    public userShortname: string;
    public idOperatorUser: OPERATORS;
    public role: ROLES;
    public type: TRANSACTION_STATUS;
    public created_at: number;

    public origin: string;
    public destination: string;
    public departureDate: number;
    public arrivalDate: number;
    public departureGps: string;
    public arrivalGps: string;
    public userDepartureDate: number;
    public userArrivalDate: number;
    public userDepartureGps: string;
    public userArrivalGps: string;
    public userPhone: string;

    public static CreateProofYupSchema(): any {
        return Yup.object()
            .shape({
                idProof: Yup.string().notRequired(),
                idTrip: Yup.string().notRequired(),
                idOffer: Yup.string().required(),
                idOperator: Yup.string().required().oneOf([
                    OPERATORS.OP1,
                    OPERATORS.OP2
                ]),
                idUser: Yup.string().required(),
                userShortname: Yup.string().required(),
                idOperatorUser: Yup.string().required().oneOf([
                    OPERATORS.OP1,
                    OPERATORS.OP2]),
                role: Yup.string().required().oneOf([
                    ROLES.DRIVER,
                    ROLES.PASSENGER
                ]),
                type: Yup.string().required().oneOf([
                    TRANSACTION_STATUS.CONFIRMATION,
                    TRANSACTION_STATUS.TRIP_STARTED,
                    TRANSACTION_STATUS.TRIP_ENDED]),
                created_at: Yup.number().integer().positive().required('Creation date as unix timestamp is required'),
                
                origin: Yup.string().required(),
                destination: Yup.string().required(),
                departureDate: Yup.number().integer().positive().required('Departure date as unix timestamp is required'),
                arrivalDate: Yup.number().integer().positive().required('Arrival date as unix timestamp is required'),
                departureGps: Yup.string().required(),
                arrivalGps: Yup.string().required(),

                userDepartureDate: Yup.number().integer().positive(),
                userArrivalDate: Yup.number().integer().positive(),
                userDepartureGps: Yup.string(),
                userArrivalGps: Yup.string(),
                userPhone: Yup.string(),
            });
    }

    public static UpgradeProofYupSchema(): any {
        return Yup.object()
            .shape({
                idOffer: Yup.string().required(),
                idOperator: Yup.string().required(),
                idUser: Yup.string().required(),
                idOperatorUser: Yup.string().required(),
                gps: Yup.string().required(),
                date: Yup.number().required(),
                type: Yup.string().required().oneOf([
                    TRANSACTION_STATUS.TRIP_STARTED,
                    TRANSACTION_STATUS.TRIP_ENDED]),
                phone: Yup.string().required()
            })
    }
}
