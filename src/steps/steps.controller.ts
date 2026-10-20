import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthPayload } from '../auth/auth-payload.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateStepDto } from './dto/create-step.dto.js';
import { UpdateStepDto } from './dto/update-step.dto.js';
import { StepResponseDto } from './dto/step-response.dto.js';
import { StepCreationService } from './services/step-creation.service.js';
import { StepDeleteService } from './services/step-delete.service.js';
import { StepEditService } from './services/step-edit.service.js';
import { StepFindService } from './services/step-find.service.js';
import { Step } from '../generated/prisma/client.js';

@ApiTags('steps')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({ description: 'Missing, invalid or expired token' })
@UseGuards(JwtAuthGuard)
@Controller('job-openings/:jobOpeningId/steps')
export class StepsController {
  constructor(
    private readonly stepFindService: StepFindService,
    private readonly stepCreationService: StepCreationService,
    private readonly stepEditService: StepEditService,
    private readonly stepDeleteService: StepDeleteService,
  ) {}

  private transformStep(step: Step): StepResponseDto {
    return {
      id: step.id,
      name: step.name,
      description: step.description,
      order: step.order,
      jobOpeningId: step.jobOpeningId,
      createdAt: step.createdAt,
      updatedAt: step.updatedAt,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all steps for a job opening' })
  @ApiParam({ name: 'jobOpeningId', description: 'Job opening identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'List of steps ordered by order', type: [StepResponseDto] })
  @ApiBadRequestResponse({ description: 'The jobOpeningId is not a valid UUID' })
  async findAll(@Param('jobOpeningId') jobOpeningId: string): Promise<StepResponseDto[]> {
    const steps = await this.stepFindService.findAll(jobOpeningId);
    return steps.map((s) => this.transformStep(s));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single step by id' })
  @ApiParam({ name: 'jobOpeningId', description: 'Job opening identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiParam({ name: 'id', description: 'Step identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'The requested step', type: StepResponseDto })
  @ApiBadRequestResponse({ description: 'The id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'No step exists with that id' })
  async findOne(@Param('jobOpeningId') jobOpeningId: string, @Param('id') id: string): Promise<StepResponseDto> {
    const step = await this.stepFindService.findById(id);
    if (step.jobOpeningId !== jobOpeningId) {
      throw new Error('Step does not belong to this job opening');
    }
    return this.transformStep(step);
  }

  @Post()
  @ApiOperation({ summary: 'Create a step for a job opening' })
  @ApiParam({ name: 'jobOpeningId', description: 'Job opening identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiCreatedResponse({ description: 'The created step', type: StepResponseDto })
  @ApiBadRequestResponse({ description: 'The payload failed validation or step order already exists' })
  async create(
    @CurrentUser() requester: AuthPayload,
    @Param('jobOpeningId') jobOpeningId: string,
    @Body() dto: CreateStepDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StepResponseDto> {
    const step = await this.stepCreationService.create(jobOpeningId, dto);
    res.setHeader('Location', `/job-openings/${jobOpeningId}/steps/${step.id}`);
    return this.transformStep(step);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a step' })
  @ApiParam({ name: 'jobOpeningId', description: 'Job opening identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiParam({ name: 'id', description: 'Step identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'The updated step', type: StepResponseDto })
  @ApiBadRequestResponse({ description: 'The payload failed validation or step order already exists' })
  @ApiNotFoundResponse({ description: 'No step exists with that id' })
  async update(
    @CurrentUser() requester: AuthPayload,
    @Param('jobOpeningId') jobOpeningId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStepDto,
  ): Promise<StepResponseDto> {
    const step = await this.stepEditService.update(id, dto);
    if (step.jobOpeningId !== jobOpeningId) {
      throw new Error('Step does not belong to this job opening');
    }
    return this.transformStep(step);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a step' })
  @ApiParam({ name: 'jobOpeningId', description: 'Job opening identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiParam({ name: 'id', description: 'Step identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiNoContentResponse({ description: 'The step was deleted' })
  @ApiBadRequestResponse({ description: 'The id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'No step exists with that id' })
  async remove(
    @CurrentUser() requester: AuthPayload,
    @Param('jobOpeningId') jobOpeningId: string,
    @Param('id') id: string,
  ): Promise<void> {
    const step = await this.stepFindService.findById(id);
    if (step.jobOpeningId !== jobOpeningId) {
      throw new Error('Step does not belong to this job opening');
    }
    return this.stepDeleteService.remove(id);
  }
}