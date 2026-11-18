import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import type { AuthPayload } from '../auth/auth-payload.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PutTalentPoolEntryDto } from './dto/put-talent-pool-entry.dto.js';
import { TalentPoolEntryResponseDto } from './dto/talent-pool-entry-response.dto.js';
import { TalentPoolService } from './talent-pool.service.js';

const profileIdParam = {
  name: 'profileId',
  schema: { type: 'string', format: 'uuid' },
};

class TalentPoolQuery {
  @IsOptional()
  @IsString()
  search?: string;
}

@ApiTags('talent-pool')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({ description: 'Missing, invalid or expired token' })
@UseGuards(JwtAuthGuard)
@Controller('talent-pool')
export class TalentPoolController {
  constructor(private readonly talentPoolService: TalentPoolService) {}

  @Get()
  @ApiOperation({ summary: 'List talent pool entries, newest first' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Case-insensitive substring of a profile name, skill, cultural fit or note',
  })
  @ApiOkResponse({ type: [TalentPoolEntryResponseDto] })
  findAll(
    @Query() query: TalentPoolQuery,
    @CurrentUser() requester: AuthPayload,
  ): Promise<TalentPoolEntryResponseDto[]> {
    return this.talentPoolService.findAll(requester.companyId, query.search);
  }

  @Get(':profileId')
  @ApiOperation({ summary: 'Get the talent pool entry for a profile' })
  @ApiParam(profileIdParam)
  @ApiOkResponse({ type: TalentPoolEntryResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid profile UUID' })
  @ApiNotFoundResponse({ description: 'Profile is not in the talent pool' })
  findOne(
    @Param('profileId', new ParseUUIDPipe()) profileId: string,
    @CurrentUser() requester: AuthPayload,
  ): Promise<TalentPoolEntryResponseDto> {
    return this.talentPoolService.findOne(requester.companyId, profileId);
  }

  @Put(':profileId')
  @ApiOperation({
    summary: 'Add a profile or replace the note on an existing entry',
  })
  @ApiParam(profileIdParam)
  @ApiOkResponse({ type: TalentPoolEntryResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid profile UUID or note' })
  @ApiNotFoundResponse({ description: 'Profile does not exist' })
  put(
    @Param('profileId', new ParseUUIDPipe()) profileId: string,
    @Body() dto: PutTalentPoolEntryDto,
    @CurrentUser() requester: AuthPayload,
  ): Promise<TalentPoolEntryResponseDto> {
    return this.talentPoolService.upsert(
      requester.companyId,
      profileId,
      dto.note || null,
      requester.sub,
    );
  }

  @Delete(':profileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a profile from the talent pool' })
  @ApiParam(profileIdParam)
  @ApiNoContentResponse()
  @ApiBadRequestResponse({ description: 'Invalid profile UUID' })
  @ApiNotFoundResponse({ description: 'Profile is not in the talent pool' })
  remove(
    @Param('profileId', new ParseUUIDPipe()) profileId: string,
    @CurrentUser() requester: AuthPayload,
  ): Promise<void> {
    return this.talentPoolService.remove(requester.companyId, profileId);
  }
}
