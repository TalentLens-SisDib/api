import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateCulturalFitDto } from './dto/create-cultural-fit.dto.js';
import { CulturalFitResponseDto } from './dto/cultural-fit-response.dto.js';
import { CulturalFitCreationService } from './services/cultural-fit-creation.service.js';
import { CulturalFitFindService } from './services/cultural-fit-find.service.js';

@ApiTags('cultural-fits')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({ description: 'Missing, invalid or expired token' })
@UseGuards(JwtAuthGuard)
@Controller('cultural-fits')
export class CulturalFitsController {
  constructor(
    private readonly culturalFitFindService: CulturalFitFindService,
    private readonly culturalFitCreationService: CulturalFitCreationService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all cultural fits' })
  @ApiOkResponse({
    description: 'List of all cultural fits',
    type: [CulturalFitResponseDto],
  })
  findAll(): Promise<CulturalFitResponseDto[]> {
    return this.culturalFitFindService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a cultural fit' })
  @ApiCreatedResponse({
    description: 'The created cultural fit',
    type: CulturalFitResponseDto,
  })
  @ApiBadRequestResponse({ description: 'The payload failed validation' })
  @ApiConflictResponse({ description: 'A cultural fit with this name already exists' })
  async create(
    @Body() dto: CreateCulturalFitDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CulturalFitResponseDto> {
    const culturalFit = await this.culturalFitCreationService.create(dto);
    res.setHeader('Location', `/cultural-fits/${culturalFit.id}`);
    return culturalFit;
  }
}
