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
  Query,
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
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthPayload } from '../auth/auth-payload.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateInterviewDto } from './dto/create-interview.dto.js';
import { UpdateInterviewDto } from './dto/update-interview.dto.js';
import { InterviewResponseDto } from './dto/interview-response.dto.js';
import { InterviewCreationService } from './services/interview-creation.service.js';
import { InterviewDeleteService } from './services/interview-delete.service.js';
import { InterviewEditService } from './services/interview-edit.service.js';
import { InterviewFindService } from './services/interview-find.service.js';
import { Interview } from '../generated/prisma/client.js';

@ApiTags('interviews')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({ description: 'Missing, invalid or expired token' })
@UseGuards(JwtAuthGuard)
@Controller('steps/:stepId/interviews')
export class InterviewsController {
  constructor(
    private readonly interviewFindService: InterviewFindService,
    private readonly interviewCreationService: InterviewCreationService,
    private readonly interviewEditService: InterviewEditService,
    private readonly interviewDeleteService: InterviewDeleteService,
  ) {}

  private transformInterview(interview: Interview): InterviewResponseDto {
    return {
      id: interview.id,
      transcript: interview.transcript,
      keyTakeaways: JSON.parse(interview.keyTakeaways || '[]'),
      userId: interview.userId,
      stepId: interview.stepId,
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all interviews for a step (or all interviews for current user)' })
  @ApiParam({ name: 'stepId', description: 'Step identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiQuery({ name: 'my', required: false, description: 'Filter to only current user interviews', example: 'true' })
  @ApiOkResponse({ description: 'List of interviews', type: [InterviewResponseDto] })
  @ApiBadRequestResponse({ description: 'The stepId is not a valid UUID' })
  async findAll(
    @CurrentUser() requester: AuthPayload,
    @Param('stepId') stepId: string,
    @Query('my') my?: string,
  ): Promise<InterviewResponseDto[]> {
    const userId = my === 'true' ? requester.sub : undefined;
    const interviews = await this.interviewFindService.findAll(stepId, userId);
    return interviews.map((i) => this.transformInterview(i));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single interview by id' })
  @ApiParam({ name: 'stepId', description: 'Step identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiParam({ name: 'id', description: 'Interview identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'The requested interview', type: InterviewResponseDto })
  @ApiBadRequestResponse({ description: 'The id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'No interview exists with that id' })
  async findOne(@Param('stepId') stepId: string, @Param('id') id: string): Promise<InterviewResponseDto> {
    const interview = await this.interviewFindService.findById(id);
    if (interview.stepId !== stepId) {
      throw new Error('Interview does not belong to this step');
    }
    return this.transformInterview(interview);
  }

  @Post()
  @ApiOperation({ summary: 'Create an interview for a step (current user)' })
  @ApiParam({ name: 'stepId', description: 'Step identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiCreatedResponse({ description: 'The created interview', type: InterviewResponseDto })
  @ApiBadRequestResponse({ description: 'The payload failed validation or interview already exists for this user and step' })
  async create(
    @CurrentUser() requester: AuthPayload,
    @Param('stepId') stepId: string,
    @Body() dto: CreateInterviewDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<InterviewResponseDto> {
    const interview = await this.interviewCreationService.create(requester.sub, stepId, dto);
    res.setHeader('Location', `/steps/${stepId}/interviews/${interview.id}`);
    return this.transformInterview(interview);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an interview (only owner)' })
  @ApiParam({ name: 'stepId', description: 'Step identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiParam({ name: 'id', description: 'Interview identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'The updated interview', type: InterviewResponseDto })
  @ApiBadRequestResponse({ description: 'The payload failed validation' })
  @ApiNotFoundResponse({ description: 'No interview exists with that id' })
  async update(
    @CurrentUser() requester: AuthPayload,
    @Param('stepId') stepId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInterviewDto,
  ): Promise<InterviewResponseDto> {
    const interview = await this.interviewFindService.findById(id);
    if (interview.stepId !== stepId) {
      throw new Error('Interview does not belong to this step');
    }
    if (interview.userId !== requester.sub) {
      throw new Error('You can only update your own interviews');
    }
    const updated = await this.interviewEditService.update(id, dto);
    return this.transformInterview(updated);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an interview (only owner)' })
  @ApiParam({ name: 'stepId', description: 'Step identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiParam({ name: 'id', description: 'Interview identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiNoContentResponse({ description: 'The interview was deleted' })
  @ApiBadRequestResponse({ description: 'The id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'No interview exists with that id' })
  async remove(
    @CurrentUser() requester: AuthPayload,
    @Param('stepId') stepId: string,
    @Param('id') id: string,
  ): Promise<void> {
    const interview = await this.interviewFindService.findById(id);
    if (interview.stepId !== stepId) {
      throw new Error('Interview does not belong to this step');
    }
    if (interview.userId !== requester.sub) {
      throw new Error('You can only delete your own interviews');
    }
    return this.interviewDeleteService.remove(id);
  }
}