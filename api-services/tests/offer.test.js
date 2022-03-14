/* eslint-disable no-unused-expressions */
const request = require('supertest');
const chai = require('chai');
const chaiHttp = require('chai-http');
const randomstring = require('randomstring');
const httpStatus = require('http-status/lib/index');

const {expect} = chai;
const app = require('../src');
const logger = require('../src/config/logger');
const {getRandomBasicOffer} = require('./helpers/helpers');

chai.use(chaiHttp);

describe('## Offer APIs', () => {
  before(async () => {
    this.user = {
      "username": randomstring.generate(5),
      "idOperator": getRandomBasicOffer().idOperator
    };
    try {
      const resp = await request(app).post('/api/v1/auth/login')
        .send(this.user)
        .expect(httpStatus.OK);
      expect(resp.body).to.have.property('token');
      this.token = resp.body.token.value;
      logger.debug('Before all: user created successfully');
    } catch (e) {
      logger.error(e.stack);
    }
  });

  describe('# POST /offer', () => {
    const postOffers = {"offers": [getRandomBasicOffer()]};
    const postOffersBadRequest = {
      "offers": [
        {
          "idOffer": postOffers.offers[0].idOffer,
          "idDriver": "739139",
          "driverShortname": "BBob",
          "origin": "10 Allée du Vieux Chêne, 69380 Lissieu",
          "destination": "5 Avenue Tony Garnier, 69000 Lyon",
          "departureGPS": "45.843384,4.743948",
          "arrivalGPS": "45.730942,4.823909",
          "date": "2019-04-23T14:20:00Z",
          "price": 1.2,
          "availableSeats": 3,
          "driver": {
            "photo": "https://api.xxx.com/image/132279.jpeg",
            "age": 35,
            "note": 4,
            "identityVerified": true,
            "phoneVerified": true,
            "emailVerified": true,
            "lang": ["English", "French"]
          },
          "trip": {
            "distance": 17397,
            "duration": "1:20:20",
            "hasHighways": false,
            "departure": {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  4.827579,
                  45.726635
                ]
              },
              "properties": {
                "source": "openstreetmap",
                "source_id": "polyline:268944",
                "name": "Avenue Tony Garnier",
                "country": "France",
                "country_gid": "whosonfirst:country:85633147",
                "macroregion": "Auvergne-Rhône-Alpes",
                "localadmin_gid": "whosonfirst:localadmin:404428859",
                "locality": "Lyon",
                "label": "Avenue Tony Garnier, Lyon, France",
                "layer": "street",
                "street": "Avenue Tony Garnier",
                "region_gid": "whosonfirst:region:85683569",
                "macrocounty": "1er Arr.",
                "country_a": "FRA",
                "macrocounty_gid": "whosonfirst:macrocounty:404227735",
                "locality_gid": "whosonfirst:locality:101749431",
                "continent_gid": "whosonfirst:continent:102191581",
                "gid": "openstreetmap:street:polyline:268944",
                "macroregion_gid": "whosonfirst:macroregion:1108826389",
                "localadmin": "7e Arr.",
                "id": "polyline:268944",
                "confidence": 0.8,
                "county": "1er Arr.",
                "match_type": "fallback",
                "accuracy": "centroid",
                "region": "Département du Rhône",
                "county_gid": "whosonfirst:county:102072419",
                "continent": "Europe"
              }
            },
            "arrival": {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  4.827579,
                  45.726635
                ]
              },
              "properties": {
                "source": "openstreetmap",
                "source_id": "polyline:268944",
                "name": "Avenue Tony Garnier",
                "country": "France",
                "country_gid": "whosonfirst:country:85633147",
                "macroregion": "Auvergne-Rhône-Alpes",
                "localadmin_gid": "whosonfirst:localadmin:404428859",
                "locality": "Lyon",
                "label": "Avenue Tony Garnier, Lyon, France",
                "layer": "street",
                "street": "Avenue Tony Garnier",
                "region_gid": "whosonfirst:region:85683569",
                "macrocounty": "1er Arr.",
                "country_a": "FRA",
                "macrocounty_gid": "whosonfirst:macrocounty:404227735",
                "locality_gid": "whosonfirst:locality:101749431",
                "continent_gid": "whosonfirst:continent:102191581",
                "gid": "openstreetmap:street:polyline:268944",
                "macroregion_gid": "whosonfirst:macroregion:1108826389",
                "localadmin": "7e Arr.",
                "id": "polyline:268944",
                "confidence": 0.8,
                "county": "1er Arr.",
                "match_type": "fallback",
                "accuracy": "centroid",
                "region": "Département du Rhône",
                "county_gid": "whosonfirst:county:102072419",
                "continent": "Europe"
              }
            },
            "path": "https://www.xxx.com/mon-annonce/2698609?isReturnSearch=null&returnSearchUrl=null"
          },
          "vehicle": {
            "photo": "https://api.xxx.com/image/xxx.jpeg",
            "brand": "Renault",
            "model": "Clio",
            "color": "Red",
            "availableSeats": 3
          }
        }
      ]
    };
    const params = {
      "idOffer": postOffers.offers[0].idOffer,
      "idOperator": postOffers.offers[0].idOperator
    };

    it('should create new offer(s)', async () => {
      await request(app)
        .post('/api/v1/offer')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .send(postOffers)
        .expect(httpStatus.CREATED)
    });

    it('should handle express validation error - idOperator is required', async () => {
      let res = await request(app)
        .post('/api/v1/offer')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .send(postOffersBadRequest)
        .expect(httpStatus.BAD_REQUEST);

      expect(res.body).to.exist;

      res = await request(app)
        .get(`/api/v1/offer/${params.idOperator}/${params.idOffer}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .expect(httpStatus.OK);

      expect(res.body.idOperator).to.equal(params.idOperator);
      expect(res.body.idOffer).to.equal(params.idOffer);
    });

  });

  describe('# PATCH /offer/:idOperator/:idOffer', () => {
    const updateOffer = {
      availableSeats: 1
    };

    before(async () => {
      this.offer = getRandomBasicOffer();
      try {
        await request(app)
          .post('/api/v1/offer/')
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${this.token}`)
          .send({'offers': [this.offer]})
          .expect(httpStatus.CREATED);
      } catch (e) {
        logger.error(e.stack);
      }
    });

    it('should update offer available seats', async () => {
      // update the offer
      await request(app)
        .patch(`/api/v1/offer/${this.user.idOperator}/${this.offer.idOffer}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .send(updateOffer)
        .expect(httpStatus.OK);

      // retrieve the offer and check the new available seat
      const res = await request(app)
        .get(`/api/v1/offer/${this.user.idOperator}/${this.offer.idOffer}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .expect(httpStatus.OK);

      expect(res.body.availableSeats).to.equal(updateOffer.availableSeats);
    });
  });

  describe('# GET /offer/', () => {
    const searchOffer = {
      origin: '45.843384,4.743948',
      destination: '45.730942,4.823909',
      date: '2019-06-20T12:20:00Z',
      radius: 1000
    };

    before(async () => {
      this.offer = getRandomBasicOffer();
      try {
        await request(app)
          .post('/api/v1/offer')
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${this.token}`)
          .send({'offers': [this.offer]})
          .expect(httpStatus.CREATED);
      } catch (e) {
        logger.error(e.stack);
        throw e
      }
    });

    it('should handle express validation error - date value is wrong', async () => {
      const res = await request(app)
        .get('/api/v1/offer')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .query({origin: 'Toulouse', destination: 'Lyon', date: '2018-10-09T23:00:00.000Z'})
        .expect(httpStatus.BAD_REQUEST);
      expect(res.body).to.exist;
    });

    it('should get offer details', async () => {
      const res = await request(app)
        .get(`/api/v1/offer/${this.offer.idOperator}/${this.offer.idOffer}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .expect(httpStatus.OK);
      expect(res.body.idOperator).to.equal(this.offer.idOperator);
      expect(res.body.idOffer).to.equal(this.offer.idOffer);
    });

    it('should get offers with corresponding OD, date, radius', async () => {
      const res = await request(app)
        .get('/api/v1/offer')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .query({
          origin: searchOffer.origin,
          destination: searchOffer.destination,
          date: searchOffer.date,
          radius: searchOffer.radius
        })
        .expect(httpStatus.OK);

      expect(res.body).to.be.an('array');
    });

    it('should report error with message - Not found', async () => {
      const res = await request(app)
        .get(`/api/v1/offer/${this.offer.idOffer}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .expect(httpStatus.NOT_FOUND);
      expect(res.body).to.exist;
    });
  });

  describe('# Test offer for Paul - (to be removed)', () => {

    it('should get offer details', async () => {
      const res = await request(app)
        .get('/api/v1/offer/ovx/5de51b3fb3cb1f00013c62ee')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .expect(httpStatus.OK);
      const result = res.body;
      expect(result.idOperator).to.equal('ovx');
    });

  })
});
