import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const JOB_CRITERION_NAME_MAX_LENGTH = 200;
export const JOB_CRITERION_DESCRIPTION_MAX_LENGTH = 2000;
export const MAX_JOB_CRITERION_SUGGESTIONS = 8;

export const JOB_CRITERION_SUGGESTIONS_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'job_criterion_suggestions',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['suggestions'],
      properties: {
        suggestions: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'description'],
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
      },
    },
  },
} as const;

export class JobCriterionSuggestionDto {
  @ApiProperty({ maxLength: JOB_CRITERION_NAME_MAX_LENGTH })
  @IsString()
  @MinLength(1)
  @MaxLength(JOB_CRITERION_NAME_MAX_LENGTH)
  name!: string;

  @ApiProperty({ maxLength: JOB_CRITERION_DESCRIPTION_MAX_LENGTH })
  @IsString()
  @MaxLength(JOB_CRITERION_DESCRIPTION_MAX_LENGTH)
  description!: string;
}

export class JobCriterionSuggestionsResponseDto {
  @ApiProperty({
    type: [JobCriterionSuggestionDto],
    maxItems: MAX_JOB_CRITERION_SUGGESTIONS,
  })
  @IsArray()
  @ArrayMaxSize(MAX_JOB_CRITERION_SUGGESTIONS)
  @ValidateNested({ each: true })
  @Type(() => JobCriterionSuggestionDto)
  suggestions!: JobCriterionSuggestionDto[];
}
