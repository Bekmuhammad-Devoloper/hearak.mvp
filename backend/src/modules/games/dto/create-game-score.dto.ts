import { IsIn, IsInt, Min } from 'class-validator';

export const GAME_KINDS = ['sound-find', 'direction', 'word-pick', 'repeat'] as const;
export type GameKindWire = (typeof GAME_KINDS)[number];

export class CreateGameScoreDto {
  @IsIn(GAME_KINDS as unknown as string[])
  game!: GameKindWire;

  @IsInt()
  @Min(0)
  score!: number;

  @IsInt()
  @Min(1)
  total!: number;
}
