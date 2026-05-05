import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const TONES = ['technical', 'casual', 'poetic', 'narrative'] as const;
export const LENGTHS = ['short', 'medium', 'long'] as const;
export type Tone = (typeof TONES)[number];
export type Length = (typeof LENGTHS)[number];

export class CreateAiDraftDto {
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  prompt!: string;

  @IsIn(TONES)
  @IsOptional()
  tone?: Tone = 'technical';

  @IsIn(LENGTHS)
  @IsOptional()
  length?: Length = 'medium';
}
