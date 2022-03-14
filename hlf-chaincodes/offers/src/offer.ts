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

import * as Yup from 'yup';
import {OPERATORS} from './utils';

export class Offer {
    public docType?: string;
    public idTrip?: string;
    public idOffer: string;
    public idOperator: string;
    public idDriver: string;
    public driverShortname: string;
    public origin: string;
    public destination: string;
    public departureGps: string;
    public arrivalGps: string;
    public date: number;
    public startDate: number;
    public endDate: number;
    public priceMax?: number;
    public price: number;
    public availableSeats: number;
    public geohashLevel: number;
    public geohashDeparture: string;
    public geohashArrival: string;
    public driverPhoto?: string;
    public driverAge?: number;
    public driverNote?: number;
    public driverIdentityVerified?: boolean;
    public driverPhoneVerified?: boolean;
    public driverEmailVerified?: boolean;
    public driverLang?: string[];
    public vehiclePhoto?: string;
    public vehicleBrand?: string;
    public vehicleModel?: string;
    public vehicleColor?: string;
    public vehicleAvailableSeats?: number;
    public tripDistance?: number;
    public tripDuration?: string;
    public tripHasHighways?: boolean;
    public tripDeparture?: string;
    public tripArrival?: string;
    public tripPath?: string;

    // validation schema for a single offer
    public static getOfferYupSchema(): any {
        return Yup.object()
            .shape({
                idTrip: Yup.string().notRequired(),
                idOffer: Yup.string().required(),
                idOperator: Yup.string().required().oneOf([
                    OPERATORS.OP1,
                    OPERATORS.OP2]),
                idDriver: Yup.string().required(),
                driverShortname: Yup.string().required(),
                origin: Yup.string().required(),
                destination: Yup.string().required(),
                departureGps: Yup.string().notRequired(),
                arrivalGps: Yup.string().notRequired(),
                date: Yup.number().integer().positive().notRequired(),
                startDate: Yup.number().integer().positive().required('startDate as unix timestamp is required'),
                endDate: Yup.number().integer().positive().required('endDate as unix timestamp is required'),
                price: Yup.number().required().positive(),
                priceMax: Yup.number().notRequired().positive(),
                availableSeats: Yup.number().required().integer().max(5).min(1).default(3),
                geohashLevel: Yup.number().required().integer().max(10).min(1).default(6),
                geohashDeparture: Yup.string().required(),
                geohashArrival: Yup.string().required(),

                driverPhoto: Yup.string(),
                driverAge: Yup.number().integer(),
                driverNote: Yup.number().integer().min(1).max(5),
                driverIdentityVerified: Yup.boolean(),
                driverPhoneVerified: Yup.boolean(),
                driverEmailVerified: Yup.boolean(),
                driverLanguage: Yup.array().of(Yup.string()),

                vehiclePhoto: Yup.string(),
                vehicleBrand: Yup.string(),
                vehicleModel: Yup.string(),
                vehicleColor: Yup.string(),
                vehicleAvailableSeats: Yup.number().integer().max(5).min(1),

                tripDistance: Yup.number().positive(),
                tripDuration: Yup.string(),
                tripHasHighways: Yup.boolean(),
                tripDeparture: Yup.string(),
                tripArrival: Yup.string(),
                tripPath: Yup.string()
            });
    }

    // validation schema for a list of offers
    public static getOffersYupSchema(): any {
        return Yup.array().of(this.getOfferYupSchema());
    }
}
