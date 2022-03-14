/* tslint:disable */
import * as moment from 'moment';
import { v4 as uuid } from 'uuid';

import { OPERATORS, TRANSACTION_STATUS, ROLES } from '../../src/utils';
import { Proof } from '../../src/proof';

// @ts-ignore
function momentRandom(end = moment(), start: any) {
    const endTime = +moment(end);
    const randomNumber = (to: number, from = 0) =>
        Math.floor(Math.random() * (to - from) + from);

    if (start) {
        const startTime = +moment(start);
        if (startTime > endTime) {
            throw new Error('End date is before start date!');
        }
        return moment(randomNumber(endTime, startTime));
    }
    return moment(randomNumber(endTime));
}

export function getBasicRandomProof(type: TRANSACTION_STATUS,
        idOperatorUser: OPERATORS, role: ROLES): Proof {
    // @ts-ignore
    return {
        idOffer: uuid(),
        idOperator: OPERATORS.OVX,        
        idUser: uuid(),
        userShortname: 'Bob',
        idOperatorUser,
        role,
        type,
        created_at: moment().unix(),
        origin: 'Lyon',
        destination: 'Paris',
        departureGps: "47.04917, -0.863509",
        arrivalGps: "47.216148, -1.542356",
        departureDate: moment().add('1', 'd').unix(),
        arrivalDate:  moment().add('1', 'd').add('1', 'h').unix(),
    };
}

export function getCompleteRandomProof(type: TRANSACTION_STATUS,
        idOperatorUser: OPERATORS, role: ROLES): Proof {
    // @ts-ignore
    return {
        idOffer: uuid(),
        idOperator: OPERATORS.OVX,   
        idUser: uuid(),
        userShortname: 'Alice',
        idOperatorUser,
        role,
        type,
        created_at: moment().unix(),
        origin: 'Aire de covoiturage de Université Angers-Cholet, 49300 Cholet',
        destination: 'Gare de Nantes, 44000 Nantes',
        departureGps: "47.04917, -0.863509",
        arrivalGps: "47.216148, -1.542356",
        departureDate: moment().add('1', 'd').unix(),
        arrivalDate:  moment().add('1', 'd').add('1', 'h').unix(),
        userDepartureGps: '47.04917, -0.863509',
        userArrivalGps: '47.216148, -1.542356',
    };
}