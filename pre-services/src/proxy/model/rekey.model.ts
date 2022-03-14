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

import { Schema, Document } from "mongoose";

/**
 * Mongoose ReKey Schema
 */
export const ReKeySchema = new Schema({
  idOperatorDelegator: { type: String, required: true },
  idOperatorDelegatee: { type: String, required: true },
  reKey: { type: String, required: true },
});

/**
 * Mongoose ReKey Document
 */
export interface IReKey extends Document {
  /**
   * UUID
   */
  readonly _id: Schema.Types.ObjectId;
  /**
   * IdOperatorDelegator
   */
  readonly idOperatorDelegator: string;
  /**
   * IdOperatorDelegatee
   */
  readonly idOperatorDelegatee: string;
  /**
   * ReKey
   */
  readonly reKey: string;
}
