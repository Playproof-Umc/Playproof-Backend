import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
export class TermDto {
  @IsNumber()
  id!: number;

  @IsBoolean()
  agree!: boolean;
}

export class GameInfoDto {
    /**
     * @example 1
     */
    @IsNumber()
    gameId!: number;

    /**
     * @example "League of Legends"
     */
    @IsString()
    @IsNotEmpty()
    gameName!: string;
  
    /**
     * @example "honggildong123"
     */
    @IsString()
    gameNickname!: string;

    /**
    * @example "example-account-id-12345"
    */
    @IsString()
    @IsOptional()
    accountId?: string;

    /**
    * @example "manner"
    */
    @IsString()
    @IsNotEmpty()
    playStyle!: string;

    /**
    * @example 101
    */
    @IsNumber()
    @IsOptional()
    positionId?: number;
    /**
    * @example 101
    */
    @IsNumber()
    @IsOptional()
    tierId?: number;

}