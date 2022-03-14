/* tslint:disable */
// @ts-nocheck
import {expect} from "chai";
import * as path from "path";
import {ChaincodeMockStub, Transform} from '@theledger/fabric-mock-stub';
import {OfferChaincode} from '../src/offerChaincode';
import {OPERATORS, Utils} from '../src/utils';
import {Offer} from '../src/offer';
// @ts-ignore
import {initKmsChaincode, get_random_offer, get_random_offer_complete, userCertOvx} from './utils';

const chaincode = new OfferChaincode();

describe('Test OfferChaincode',  () => {

    this.stub = new ChaincodeMockStub("MyMockStub", chaincode, userCertOvx);

    it("Should init without issues", async () => {

        let response = await this.stub.mockInit("tx1", []);
        expect(response.status).to.eql(200);
        response = await initKmsChaincode(this.stub);
        expect(response.status).to.eql(200);
    });

    it("Should be able to add a offer", async () => {
        const offers = [get_random_offer(), get_random_offer()];
        const resp = await this.stub.mockInvoke("tx1", ['createOffers', JSON.stringify(offers)]);
        expect(resp.status).to.eq(200);

        for (let offer of offers) {
            const resp2 = await this.stub.mockInvoke("tx1", ['queryOfferById', JSON.stringify({
                idOffer: offer.idOffer,
                idOperator: offer.idOperator
            })]);

            let result = Transform.bufferToObject(resp2.payload);

            offer.docType = 'offer';
            offer.idTrip = result[0].idTrip;
            expect(result[0]).to.deep.eq(offer)
        }
    });

    it("Should be able to add a complete offer", async () => {
        const offers = [get_random_offer_complete()];
        const resp = await this.stub.mockInvoke("tx1", ['createOffers', JSON.stringify(offers)]);

        expect(resp.status).to.eql(200);

        for (let offer of offers) {
            const resp2 = await this.stub.mockInvoke("tx1", ['queryOfferById', JSON.stringify({
                idOffer: offer.idOffer,
                idOperator: offer.idOperator
            })]);

            let result = Transform.bufferToObject(resp2.payload);

            offer.docType = 'offer';
            offer.idTrip = result[0].idTrip;
            expect(result[0]).to.deep.eq(offer)
        }
    });

    it("QueryByGeoHash should not retrieve all the fields", async () => {
        // Post an offer
        const offer = get_random_offer_complete();
        const resp = await this.stub.mockInvoke("tx1", ['createOffers', JSON.stringify([offer])]);
        expect(resp.status).to.eq(200);

        const resp2 = await this.stub.mockInvoke("tx1", ['queryOffersByGeohash', JSON.stringify({
            geohashDeparture: offer.geohashDeparture,
            geohashArrival: offer.geohashArrival,
            start_date: offer.startDate - 3600,
            end_date: offer.startDate + 3600
        })]);

        let result = Transform.bufferToObject(resp2.payload)[0];
        expect(result).to.be.an('object');
    });

    it("Should be reject already registered offer", async () => {
        const offer = get_random_offer();

        let resp = await this.stub.mockInvoke("tx1", ['createOffers', JSON.stringify([offer])]);
        expect(resp.status).to.eq(200);

        resp = await this.stub.mockInvoke("tx1", ['createOffer', JSON.stringify(offer)]);
        expect(resp.status).to.eql(500);

    });

    it("Should be able to add a list of offer", async () => {
        const offers = [get_random_offer(), get_random_offer()];

        const resp = await this.stub.mockInvoke("tx1", ['createOffers', JSON.stringify(offers)]);
        expect(resp.status).to.eql(200);
    });

    it("Should reject already existing offer in the list", async () => {
        const offer = get_random_offer();
        const offers: Offer[] = [offer, get_random_offer(), offer];

        const resp = await this.stub.mockInvoke("tx1", ['createOffers', JSON.stringify(offers)]);
        expect(resp.status).to.eql(500);
        // @ts-ignore
        const message = Transform.bufferToString(resp.message);
        expect(message).to.contain('already exists')
    });

    it("Should be able to reject a list of offer", async () => {
        let offers_init: any = [
            get_random_offer(),
            {
                idDriver: '739139',
                idOperator: OPERATORS.RIDYGO,
                origin: '10 Allée du Vieux Chêne, 69380 Lissieu',
                destination: '5 Avenue Tony Garnier, 69000 Lyon',
                departureGPS: '45.843384, 4.743948',
                arrivalGPS: '45.730942, 4.823909',
                startDate: new Date('2020-02-22 10:59:59').getTime() / 1000,
                endDate: new Date('2020-02-22 10:59:59').getTime() / 1000,
                price: 1.2,
                availableSeats: 3,
                geohashLevel: 6,
                geohashDeparture: 'abcde',
                geohashArrival: 'drefg',
                driverShortname: 'Olivier D.',
                driverPhoto: 'https://api.ridygo.com/image/132279.jpeg',
                driverIdentityVerified: true,
                driverPhoneVerified: true,
                driverEmailVerified: true,
                tripDistance: 17397,
                tripDuration: '1180',
                tripHasHighways: false,
                tripDeparture: 'Point, coordinates: [4.743948, 45.8433839999999]',
                tripArrival: 'Point, coordinates: [4.823909, 45.7309419999999]',
                tripPath: '',
                vehiclePhoto: '',
                vehicleBrand: 'HYUNDAI',
                vehicleModel: 'GETZ'
            }];

        const resp = await this.stub.mockInvoke("tx1", ['createOffers', JSON.stringify(offers_init)]);
        expect(resp.status).to.eql(500);
    });

    it("Should be able to get offer by geohash", async () => {
        const offers: Offer[] = [get_random_offer(), get_random_offer()];

        // Create offers
        const resp = await this.stub.mockInvoke("tx1", ['createOffers', JSON.stringify(offers)]);
        expect(resp.status).to.eql(200);

        // Check by geohash
        const offerCandidate = offers[0];
        const response = await this.stub.mockInvoke("tx1", ['queryOffersByGeohash', JSON.stringify({
            geohashDeparture: offerCandidate.geohashDeparture,
            geohashArrival: offerCandidate.geohashArrival,
            start_date: offerCandidate.startDate - 3600,
            end_date: offerCandidate.startDate + 3600
        })]);

        expect(response.status).to.eql(200);

        expect(Transform.bufferToObject(response.payload)).to.be.length(1);
    });

    it("Should call geohash by list", async () => {
        const offers: Offer[] = [get_random_offer(), get_random_offer()];

        const resp = await this.stub.mockInvoke("tx1", ['createOffers', JSON.stringify(offers)]);
        expect(resp.status).to.eq(200);

        const offerCandidate = offers[0];
        const response = await this.stub.mockInvoke("tx1", ['queryOffersByGeohashList', JSON.stringify({
            geohashDeparture: [offerCandidate.geohashDeparture],
            geohashArrival: [offerCandidate.geohashArrival],
            start_date: offerCandidate.startDate - 3600,
            end_date: offerCandidate.startDate + 3600
        })]);

        expect(response.status).to.eql(200);

        expect(Transform.bufferToObject(response.payload)).to.be.length(1);
    });

    it('Should call update available seat', async () => {
        const offer = get_random_offer();
        let resp = await this.stub.mockInvoke("tx1", ['createOffers', JSON.stringify([offer])]);
        expect(resp.status).to.eq(200);

        resp = await this.stub.mockInvoke("tx1", ['updateOffer', JSON.stringify({
            idOffer: offer.idOffer,
            idOperator: offer.idOperator,
            availableSeats: 4
        })]);
        expect(resp.status).to.eql(200);
    })

    it('Should reject update available seat', async () => {
        const offer = get_random_offer();
        let resp = await this.stub.mockInvoke("tx1", ['createOffers', JSON.stringify([offer])]);
        expect(resp.status).to.eq(200);

        resp = await this.stub.mockInvoke("tx1", ['updateOffer', JSON.stringify({
            idOffer: offer.idOffer,
            idOperator: offer.idOperator,
            availableSeats: 6
        })]);
        expect(resp.status).to.eql(500);
    })
});

describe('Unit tests',  () => {
    it("Should load grpc proto", async () => {
        const filename = path.join(process.cwd(), 'node_modules/fabric-shim/lib/protos/peer/chaincode.proto');
        const _chaincodeProto = Utils.load(filename).protos;

        expect(_chaincodeProto).to.be.instanceOf(Object);
    });
});
