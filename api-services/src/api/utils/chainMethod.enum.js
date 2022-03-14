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

const ChainMethod = {
  createOffer: 'createOffer',
  createOffers: 'createOffers',
  queryOfferById: 'queryOfferById',
  queryOffersByGeoHash: 'queryOffersByGeohash',
  queryOffersByGeohashList: 'queryOffersByGeohashList',
  updateOfferSeatAvailable: 'updateOffer',
  createTransaction: 'pushTransaction',
  queryTransactionById: 'queryTransactionById',
  queryTransactionByOffer: 'queryTransactionByOffer',
  createProof: 'createProof',
  upgradeProof: 'upgradeProof',
  queryProofById: 'queryProofById',
  queryProofByTrip: 'queryProofByTrip',
  createKeys: 'createKeys',
  createRekey: 'createRekey',
  getKeysById: 'getKeysById',
};

module.exports = ChainMethod;
