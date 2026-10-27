import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
  ApiForbiddenResponse,
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
import { InterviewFindService, InterviewWithRelations } from './services/interview-find.service.js';

const STEP_ID_PARAM = { name: 'stepId', description: 'Step identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' };
const ID_PARAM = { name: 'id', description: 'Interview identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' };

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

  private transformInterview(interview: InterviewWithRelations): InterviewResponseDto {
    return {
      id: interview.id,
      userId: interview.userId,
      stepId: interview.stepId,
      profileInterviews: interview.profileInterviews.map((pi) => ({
        id: pi.id,
        interviewId: pi.interviewId,
        profileId: pi.profileId,
        transcript: pi.transcript,
        keyTakeaways: pi.keyTakeaways,
        startDate: pi.startDate,
        createdAt: pi.createdAt,
        updatedAt: pi.updatedAt,
      })),
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
    };
  }

  private assertOwner(interview: InterviewWithRelations, requester: AuthPayload): void {
    if (interview.userId !== requester.sub) {
      throw new ForbiddenException('You can only manage your own interviews');
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all interviews for a step (optionally only the current user ones)' })
  @ApiParam(STEP_ID_PARAM)
  @ApiQuery({ name: 'my', required: false, description: 'Filter to only current user interviews', example: 'true' })
  @ApiOkResponse({ description: 'List of interviews', type: [InterviewResponseDto] })
  @ApiBadRequestResponse({ description: 'The stepId is not a valid UUID' })
  async findAll(
    @CurrentUser() requester: AuthPayload,
    @Param('stepId', new ParseUUIDPipe()) stepId: string,
    @Query('my') my?: string,
  ): Promise<InterviewResponseDto[]> {
    const userId = my === 'true' ? requester.sub : undefined;
    const interviews = await this.interviewFindService.findAll(stepId, userId);
    return interviews.map((i) => this.transformInterview(i));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single interview by id' })
  @ApiParam(STEP_ID_PARAM)
  @ApiParam(ID_PARAM)
  @ApiOkResponse({ description: 'The requested interview', type: InterviewResponseDto })
  @ApiBadRequestResponse({ description: 'The stepId or id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'No interview with that id exists in this step' })
  async findOne(
    @Param('stepId', new ParseUUIDPipe()) stepId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<InterviewResponseDto> {
    const interview = await this.interviewFindService.findInStep(id, stepId);
    return this.transformInterview(interview);
  }

  @Post()
  @ApiOperation({ summary: 'Create an interview for a step (current user). A user may have several interviews per step.' })
  @ApiParam(STEP_ID_PARAM)
  @ApiCreatedResponse({ description: 'The created interview', type: InterviewResponseDto })
  @ApiBadRequestResponse({ description: 'The stepId is not a valid UUID or the payload has unknown properties' })
  @ApiNotFoundResponse({ description: 'No step exists with that id' })
  async create(
    @CurrentUser() requester: AuthPayload,
    @Param('stepId', new ParseUUIDPipe()) stepId: string,
    @Body() _dto: CreateInterviewDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<InterviewResponseDto> {
    const interview = await this.interviewCreationService.create(requester.sub, stepId);
    res.setHeader('Location', `/steps/${stepId}/interviews/${interview.id}`);
    return this.transformInterview(interview);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an interview (only owner). Transcripts are edited per candidate under /profiles.' })
  @ApiParam(STEP_ID_PARAM)
  @ApiParam(ID_PARAM)
  @ApiOkResponse({ description: 'The updated interview', type: InterviewResponseDto })
  @ApiBadRequestResponse({ description: 'The stepId or id is not a valid UUID or the payload has unknown properties' })
  @ApiForbiddenResponse({ description: 'The interview belongs to another user' })
  @ApiNotFoundResponse({ description: 'No interview with that id exists in this step' })
  async update(
    @CurrentUser() requester: AuthPayload,
    @Param('stepId', new ParseUUIDPipe()) stepId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() _dto: UpdateInterviewDto,
  ): Promise<InterviewResponseDto> {
    const interview = await this.interviewFindService.findInStep(id, stepId);
    this.assertOwner(interview, requester);
    const updated = await this.interviewEditService.update(id);
    return this.transformInterview(updated);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an interview and its candidate records (only owner)' })
  @ApiParam(STEP_ID_PARAM)
  @ApiParam(ID_PARAM)
  @ApiNoContentResponse({ description: 'The interview was deleted' })
  @ApiBadRequestResponse({ description: 'The stepId or id is not a valid UUID' })
  @ApiForbiddenResponse({ description: 'The interview belongs to another user' })
  @ApiNotFoundResponse({ description: 'No interview with that id exists in this step' })
  async remove(
    @CurrentUser() requester: AuthPayload,
    @Param('stepId', new ParseUUIDPipe()) stepId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    const interview = await this.interviewFindService.findInStep(id, stepId);
    this.assertOwner(interview, requester);
    return this.interviewDeleteService.remove(id);
  }
}
