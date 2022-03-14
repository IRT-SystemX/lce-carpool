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

import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Patch Profile Payload Class
 */
export class PostReencryptEntityPayload {
  /**
   * DocType field
   */
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  docType: string;

  /**
   * Metadata field
   */
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  metadata: string;

  /**
   * Capsule field
   */
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  capsule: string;

  /**
   * Entity field
   */
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entity: string;
}

export class PostReencryptPayload {
  @ApiProperty()
  @IsString()
  readonly idOperator: string;

  @ApiProperty({ type: () => [PostReencryptEntityPayload] })
  @IsArray()
  @Type(() => PostReencryptEntityPayload)
  @ValidateNested({ each: true })
  readonly entities: PostReencryptEntityPayload[];
}
