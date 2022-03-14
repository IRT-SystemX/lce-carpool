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

import {Chaincode, Helpers, StubHelper, ChaincodeError} from '@theledger/fabric-chaincode-utils';
import * as Yup from 'yup';
import {Utils} from './utils';
import {UtilsProxy} from './utilsProxy';
import {Offer} from './offer';
import {OfferEncrypted} from './offerEncrypted';

export class OfferChaincode extends Chaincode {

    initLedger = async (stubHelper: StubHelper, args: string[]) => {
        this.logger.info('InitLedger invoked successfully');
    }

    // push a list of offers to the blockchain
    createOffers = async (stubHelper: StubHelper, args: string[]) => {
        const verifiedArgs = await Helpers.checkArgs<any>(args[0], Offer.getOffersYupSchema());

        // Get the public key
        const publicKey = await Utils.getPublicKey(stubHelper, this.logger);

        let response = '';

        for (let verifiedArg of verifiedArgs) {
            let offer: Offer = {
                docType: 'offer',
                idTrip: UtilsProxy.generateUUID(verifiedArg.idOffer,verifiedArg.idOperator),
                idOffer: verifiedArg.idOffer,
                idOperator: verifiedArg.idOperator,
                idDriver: verifiedArg.idDriver,
                driverShortname: verifiedArg.driverShortname,
                origin: verifiedArg.origin,
                destination: verifiedArg.destination,
                departureGps: verifiedArg.departureGps,
                arrivalGps: verifiedArg.arrivalGps,
                date: verifiedArg.date,
                startDate: verifiedArg.startDate,
                endDate: verifiedArg.endDate,
                priceMax: verifiedArg.priceMax,
                price: verifiedArg.price,
                availableSeats: verifiedArg.availableSeats,
                geohashLevel: verifiedArg.geohashLevel,
                geohashDeparture: verifiedArg.geohashDeparture,
                geohashArrival: verifiedArg.geohashArrival,
                driverPhoto: verifiedArg.driverPhoto,
                driverAge: verifiedArg.driverAge,
                driverNote: verifiedArg.driverNote,
                driverIdentityVerified: verifiedArg.driverIdentityVerified,
                driverPhoneVerified: verifiedArg.driverPhoneVerified,
                driverEmailVerified: verifiedArg.driverEmailVerified,
                driverLang: verifiedArg.driverLang,
                vehiclePhoto: verifiedArg.vehiclePhoto,
                vehicleBrand: verifiedArg.vehicleBrand,
                vehicleModel: verifiedArg.vehicleModel,
                vehicleColor: verifiedArg.vehicleColor,
                vehicleAvailableSeats: verifiedArg.vehicleAvailableSeats,
                tripDistance: verifiedArg.tripDistance,
                tripDuration: verifiedArg.tripDuration,
                tripHasHighways: verifiedArg.tripHasHighways,
                tripDeparture: verifiedArg.tripDeparture,
                tripArrival: verifiedArg.tripArrival,
                tripPath: verifiedArg.tripPath
            };

            //Check if the offer already exists
            const results = await stubHelper.getQueryResultAsList({
                selector: {
                    docType: 'offer',
                    idTrip: offer.idTrip,
                },
                use_index: ['_design/indexTripDoc', 'indexTrip']
            });

            if (results.length > 0) {
                response += `Offer (idOffer: ${offer.idOffer} - idOperator: ${offer.idOperator}) already exists`;
                this.logger.error(response);
                continue;
            }

            // Encrypt the offer
            const encryptedOffer = UtilsProxy.encrypt(offer, publicKey);

            // Added offer
            await stubHelper.putState(encryptedOffer.idTrip, encryptedOffer);
            this.logger.info('Added <--> ', encryptedOffer);
        }

        if (response.length > 0) {
            throw new ChaincodeError(response, 500);
        }

        return Promise.resolve(response);
    }

    // retrieve an offer by its id
    queryOfferById = async (stubHelper: StubHelper, args: string[]): Promise<any> => {

        const verifiedArgs = await Helpers.checkArgs<{ idOffer: string, idOperator: string }>(args[0], Yup.object()
            .shape({
                idOffer: Yup.string().required(),
                idOperator: Yup.string().required()
            }));

        // Get the private key
        const privateKey = await Utils.getPrivateKey(stubHelper, this.logger);

        const encryptedOffers = await stubHelper.getQueryResultAsList({
            selector: {
                docType: 'offer',
                idTrip: UtilsProxy.generateUUID(verifiedArgs.idOffer, verifiedArgs.idOperator),
            },
            use_index: ['_design/indexTripDoc', 'indexTrip']
        });

        if (encryptedOffers.length < 1) {
            throw new ChaincodeError('No offer found', 500);
        }

        const idOperator = Utils.getInvokerOperator(stubHelper);
        const { message, entities } = await UtilsProxy.recrypt(<OfferEncrypted[]> encryptedOffers, idOperator);

        if (entities.length < 1) {
            throw new ChaincodeError(message, 500);
        }

        const decryptedOffers = UtilsProxy.decrypt(<OfferEncrypted> entities[0], privateKey);

        return ([ decryptedOffers ]);
    }

    // search offers using geohash departure and arrival
    queryOffersByGeohash = async (stubHelper: StubHelper, args: string[]): Promise<any> => {

        const verifiedArgs = await Helpers
            .checkArgs<{ geohashDeparture: string, geohashArrival: string, start_date: number, end_date: number }>(args[0], Yup.object()
                .shape({
                    geohashDeparture: Yup.string().required(),
                    geohashArrival: Yup.string().required(),
                    start_date: Yup.number().integer().positive().required('Start date unix timestamp is required'),
                    end_date: Yup.number().integer().positive().required('End date unix timestamp is required'),
                }));

        // Get the private key
        const privateKey = await Utils.getPrivateKey(stubHelper, this.logger);

        const offers = await stubHelper.getQueryResultAsList({
            selector: {
                docType: 'offer',
                geohashDeparture: verifiedArgs.geohashDeparture,
                geohashArrival: verifiedArgs.geohashArrival,
                startDate: {
                    $gte: verifiedArgs.start_date,
                    $lte: verifiedArgs.end_date
                }
            },
            use_index: ['_design/indexGeoHashDoc', 'indexGeoHash']
        });

        const idOperator = Utils.getInvokerOperator(stubHelper);
        const { message, entities } = await UtilsProxy.recrypt(<OfferEncrypted[]> offers, idOperator);

        if (entities.length < 1) {
            throw new ChaincodeError(message, 500);
        }

        // Decrypt all offers
        entities.forEach((item: any, index: string | number) => {
            const offerEncrypted = <OfferEncrypted> entities[index];
            const offerDecrypted = <Offer> UtilsProxy.decrypt(offerEncrypted, privateKey);

            // Assign specific fields
            // We assign the availaibleSeats of encrypted offer
            entities[index] = <Offer> {
                idOffer: offerDecrypted.idOffer,
                idOperator: offerDecrypted.idOperator,
                idDriver: offerDecrypted.idDriver,
                driverShortname: offerDecrypted.driverShortname,
                origin: offerDecrypted.origin,
                destination: offerDecrypted.destination,
                departureGps: offerDecrypted.departureGps,
                arrivalGps: offerDecrypted.arrivalGps,
                date: offerDecrypted.date,
                startDate: offerDecrypted.startDate,
                endDate: offerDecrypted.endDate,
                price: offerDecrypted.price,
                availableSeats: offerEncrypted.availableSeats
            };
        });

        return (entities);
    }

    queryOffersByGeohashList = async (stubHelper: StubHelper, args: string[]): Promise<any> => {
        const verifiedArgs = await Helpers
            .checkArgs<{ geohashDeparture: string[], geohashArrival: string[], start_date: number, end_date: number }>(args[0], Yup.object()
                .shape({
                    geohashDeparture: Yup.array(Yup.string()).required(),
                    geohashArrival: Yup.array(Yup.string()).required(),
                    start_date: Yup.number().integer().positive().required('Start date unix timestamp is required'),
                    end_date: Yup.number().integer().positive().required('End date unix timestamp is required'),
                }));
                
        // Get the private key
        const privateKey = await Utils.getPrivateKey(stubHelper, this.logger);

        const offers = await stubHelper.getQueryResultAsList({
            selector: {
                docType: 'offer',
                geohashDeparture: {
                    $in: verifiedArgs.geohashDeparture
                },
                geohashArrival: {
                    $in: verifiedArgs.geohashArrival
                },
                startDate: {
                    $gte: verifiedArgs.start_date,
                    $lte: verifiedArgs.end_date
                }
            },
            use_index: ['_design/indexGeoHashDoc', 'indexGeoHash']
        });

        const idOperator = Utils.getInvokerOperator(stubHelper);
        const { message, entities } = await UtilsProxy.recrypt(<OfferEncrypted[]> offers, idOperator);

        if (entities.length < 1) {
            throw new ChaincodeError(message, 500);
        }

        // Decrypt all offers
        entities.forEach((item: any, index: string | number) => {
            const offerEncrypted = <OfferEncrypted> entities[index];
            const offerDecrypted = <Offer> UtilsProxy.decrypt(offerEncrypted, privateKey);

            // Assign specific fields
            // We assign the availaibleSeats of encrypted offer
            entities[index] = <Offer> {
                idOffer: offerDecrypted.idOffer,
                idOperator: offerDecrypted.idOperator,
                idDriver: offerDecrypted.idDriver,
                driverShortname: offerDecrypted.driverShortname,
                origin: offerDecrypted.origin,
                destination: offerDecrypted.destination,
                departureGps: offerDecrypted.departureGps,
                arrivalGps: offerDecrypted.arrivalGps,
                date: offerDecrypted.date,
                startDate: offerDecrypted.startDate,
                endDate: offerDecrypted.endDate,
                price: offerDecrypted.price,
                availableSeats: offerEncrypted.availableSeats
            };
        });

        return (entities);
    }

    // update offer available seats
    updateOffer = async (stubHelper: StubHelper, args: any[]) => {
        const verifiedArgs = await Helpers.checkArgs<{ idOperator: string, idOffer: string, availableSeats: number }>(args[0], Yup.object()
            .shape({
                idOperator: Yup.string().required(),
                idOffer: Yup.string().required(),
                availableSeats: Yup.number().integer().min(0).max(4).required()
            }));

        // check if the offer exists
        const results = await stubHelper.getQueryResultAsList({
            selector: {
                docType: 'offer',
                idTrip: UtilsProxy.generateUUID(verifiedArgs.idOffer, verifiedArgs.idOperator),
            },
            use_index: ['_design/indexTripDoc', 'indexTrip']
        });

        if (results.length == 0) {
            const error = `Offer (idOffer: ${verifiedArgs.idOffer} - idOperator: ${verifiedArgs.idOperator}) not exist`;
            this.logger.error(error);
            throw new ChaincodeError(error);
        }

        // Get the unique offer
        const offer = <OfferEncrypted> results[0];

        //check the available seat value
        if (verifiedArgs.availableSeats <0 || verifiedArgs.availableSeats > 4)  {
            throw new ChaincodeError('Available seats update value not authorized');
        }

        //Update the offer seat available
        offer.availableSeats = verifiedArgs.availableSeats;
        await stubHelper.putState(offer.idTrip, offer);
    }

    updateOfferFromTransaction = async (stubHelper: StubHelper, args: any[]) => {
        // Check from where the method is called
        if(!Utils.invokedByChaincode(stubHelper, 'transactions', 'pushTransaction')) {
            throw new ChaincodeError('Not allowed to call this function (for internal use only');
        }

        // Check parameters
        const verifiedArgs = await Helpers.checkArgs<{ idOperator: string, idOffer: string, availableSeats: number }>(
            args[0], Yup.object().shape({
                idOperator: Yup.string().required(),
                idOffer: Yup.string().required(),
            }));

        // check if the offer exists
        const results = await stubHelper.getQueryResultAsList({
            selector: {
                docType: 'offer',
                idTrip: UtilsProxy.generateUUID(verifiedArgs.idOffer, verifiedArgs.idOperator),
            },
            use_index: ['_design/indexTripDoc', 'indexTrip']
        });

        if (results.length == 0) {
            const error = `Offer (idOffer: ${verifiedArgs.idOffer} - idOperator: ${verifiedArgs.idOperator}) not exist`;
            this.logger.error(error);
            throw new ChaincodeError(error);
        }

        // Get the unique offer
        const offer = <OfferEncrypted> results[0];

        // We assume that the owner check is already made in transaction chaincode
        // Update offer seat available
        if(offer.availableSeats <= 0) {
            throw new ChaincodeError('Update not possible - no more seat available');
        }

        offer.availableSeats = offer.availableSeats-1;
        await stubHelper.putState(offer.idTrip, offer);
    }
}
