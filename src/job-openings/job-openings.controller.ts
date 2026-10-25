import {
  Body,
  Controller,
  Delete,
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
  ApiConflictResponse,
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
import { CreateJobOpeningDto } from './dto/create-job-opening.dto.js';
import { UpdateJobOpeningDto } from './dto/update-job-opening.dto.js';
import { JobOpeningResponseDto } from './dto/job-opening-response.dto.js';
import { JobOpeningSkillResponseDto } from './dto/job-opening-skill-response.dto.js';
import { JobOpeningCulturalFitResponseDto } from './dto/job-opening-cultural-fit-response.dto.js';
import { CreateJobApplicationDto } from './dto/create-job-application.dto.js';
import { JobApplicationResponseDto } from './dto/job-application-response.dto.js';
import { JobApplicationService } from './services/job-application.service.js';
import { JobOpeningCreationService } from './services/job-opening-creation.service.js';
import { JobOpeningDeleteService } from './services/job-opening-delete.service.js';
import { JobOpeningEditService } from './services/job-opening-edit.service.js';
import { JobOpeningFindService } from './services/job-opening-find.service.js';
import { JobOpening } from '../generated/prisma/client.js';

@ApiTags('job-openings')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({ description: 'Missing, invalid or expired token' })
@UseGuards(JwtAuthGuard)
@Controller('job-openings')
export class JobOpeningsController {
  constructor(
    private readonly jobOpeningFindService: JobOpeningFindService,
    private readonly jobOpeningCreationService: JobOpeningCreationService,
    private readonly jobOpeningEditService: JobOpeningEditService,
    private readonly jobOpeningDeleteService: JobOpeningDeleteService,
    private readonly jobApplicationService: JobApplicationService,
  ) {}

  private transformSkills(requirements: Array<{ requirement: { id: string; name: string; description: string | null }; isRequired: boolean }>): JobOpeningSkillResponseDto[] {
    return requirements.map((r) => ({
      skillId: r.requirement.id,
      skillName: r.requirement.name,
      isRequired: r.isRequired,
    }));
  }

  private transformCulturalFits(culturalFits: Array<{ culturalFit: { id: string; name: string; description: string | null }; isRequired: boolean }>): JobOpeningCulturalFitResponseDto[] {
    return culturalFits.map((cf) => ({
      culturalFitId: cf.culturalFit.id,
      culturalFitName: cf.culturalFit.name,
      isRequired: cf.isRequired,
    }));
  }

  private transformJobOpening(jobOpening: JobOpening & { requirements: Array<{ requirement: { id: string; name: string; description: string | null }; isRequired: boolean }>; culturalFits: Array<{ culturalFit: { id: string; name: string; description: string | null }; isRequired: boolean }> }): JobOpeningResponseDto {
    return {
      ...jobOpening,
      skills: jobOpening.requirements ? this.transformSkills(jobOpening.requirements) : undefined,
      culturalFits: jobOpening.culturalFits ? this.transformCulturalFits(jobOpening.culturalFits) : undefined,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List job openings for the caller\'s company' })
  @ApiQuery({ name: 'mine', required: false, type: Boolean, description: 'Filter to only show current user\'s job openings' })
  @ApiOkResponse({
    description: 'List of job openings',
    type: [JobOpeningResponseDto],
  })
  async findAll(
    @CurrentUser() requester: AuthPayload,
    @Query('mine') mine?: string,
  ): Promise<JobOpeningResponseDto[]> {
    const jobOpenings = mine === 'true'
      ? await this.jobOpeningFindService.findAllByUser(requester.sub)
      : await this.jobOpeningFindService.findAllByCompany(requester.companyId);
    return jobOpenings.map((j) => this.transformJobOpening(j));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single job opening by id' })
  @ApiParam({ name: 'id', description: 'Job opening identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'The requested job opening', type: JobOpeningResponseDto })
  @ApiBadRequestResponse({ description: 'The id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'No job opening exists with that id' })
  @ApiForbiddenResponse({ description: 'The caller may not read that job opening' })
  async findOne(
    @CurrentUser() requester: AuthPayload,
    @Param('id') id: string,
  ): Promise<JobOpeningResponseDto> {
    const jobOpening = await this.jobOpeningFindService.findById(id);
    return this.transformJobOpening(jobOpening);
  }

  @Get(':id/applications')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List applications for a job opening' })
  @ApiParam({ name: 'id', description: 'Job opening identifier (UUID)', format: 'uuid' })
  @ApiOkResponse({ description: 'Applications for the job opening', type: [JobApplicationResponseDto] })
  @ApiBadRequestResponse({ description: 'The id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'No job opening exists with that id' })
  async findApplications(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<JobApplicationResponseDto[]> {
    return this.jobApplicationService.findAll(id);
  }

  @Post(':id/applications')
  @ApiOperation({ summary: 'Add a profile to a job opening' })
  @ApiParam({ name: 'id', description: 'Job opening identifier (UUID)', format: 'uuid' })
  @ApiCreatedResponse({ description: 'The created application', type: JobApplicationResponseDto })
  @ApiBadRequestResponse({ description: 'The id or payload is invalid' })
  @ApiConflictResponse({ description: 'The profile has already applied to this job opening' })
  @ApiNotFoundResponse({ description: 'No job opening or profile exists with that id' })
  @ApiForbiddenResponse({ description: 'The caller may not manage that job opening' })
  async createApplication(
    @CurrentUser() requester: AuthPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateJobApplicationDto,
  ): Promise<JobApplicationResponseDto> {
    return this.jobApplicationService.create(requester, id, dto);
  }

  @Delete(':id/applications/:profileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an application from a job opening' })
  @ApiParam({ name: 'id', description: 'Job opening identifier (UUID)', format: 'uuid' })
  @ApiParam({ name: 'profileId', description: 'Applicant profile identifier (UUID)', format: 'uuid' })
  @ApiNoContentResponse({ description: 'The application was removed' })
  @ApiBadRequestResponse({ description: 'An id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'No job opening or application exists with those ids' })
  @ApiForbiddenResponse({ description: 'The caller may not manage that job opening' })
  async removeApplication(
    @CurrentUser() requester: AuthPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('profileId', new ParseUUIDPipe()) profileId: string,
  ): Promise<void> {
    return this.jobApplicationService.remove(requester, id, profileId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a job opening' })
  @ApiCreatedResponse({
    description: 'The created job opening',
    type: JobOpeningResponseDto,
  })
  @ApiBadRequestResponse({ description: 'The payload failed validation' })
  async create(
    @CurrentUser() requester: AuthPayload,
    @Body() dto: CreateJobOpeningDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<JobOpeningResponseDto> {
    const jobOpening = await this.jobOpeningCreationService.create(requester, dto);
    res.setHeader('Location', `/job-openings/${jobOpening.id}`);
    return this.transformJobOpening(jobOpening);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update the provided fields of a job opening' })
  @ApiParam({ name: 'id', description: 'Job opening identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'The updated job opening', type: JobOpeningResponseDto })
  @ApiBadRequestResponse({ description: 'The payload failed validation' })
  @ApiNotFoundResponse({ description: 'No job opening exists with that id' })
  @ApiForbiddenResponse({ description: 'The caller may not edit that job opening' })
  async update(
    @CurrentUser() requester: AuthPayload,
    @Param('id') id: string,
    @Body() dto: UpdateJobOpeningDto,
  ): Promise<JobOpeningResponseDto> {
    const jobOpening = await this.jobOpeningEditService.update(requester, id, dto);
    return this.transformJobOpening(jobOpening);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a job opening' })
  @ApiParam({ name: 'id', description: 'Job opening identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiNoContentResponse({ description: 'The job opening was deleted' })
  @ApiBadRequestResponse({ description: 'The id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'No job opening exists with that id' })
  @ApiForbiddenResponse({ description: 'The caller may not delete that job opening' })
  async remove(
    @CurrentUser() requester: AuthPayload,
    @Param('id') id: string,
  ): Promise<void> {
    return this.jobOpeningDeleteService.remove(requester, id);
  }
}
