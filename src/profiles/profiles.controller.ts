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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiPayloadTooLargeResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthPayload } from '../auth/auth-payload.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateProfileDto } from './dto/create-profile.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ProfileResponseDto } from './dto/profile-response.dto.js';
import { ProfileSkillResponseDto } from './dto/profile-skill-response.dto.js';
import { ProfileCulturalFitResponseDto } from './dto/profile-cultural-fit-response.dto.js';
import { CvFilePipe, MAX_CV_SIZE_BYTES } from './cv-file.pipe.js';
import { ProfileWithRelations } from './profile-types.js';
import { ProfileCreationService } from './services/profile-creation.service.js';
import { ProfileDeleteService } from './services/profile-delete.service.js';
import { ProfileEditService } from './services/profile-edit.service.js';
import { ProfileFindService } from './services/profile-find.service.js';
import { ProfileInterviewService } from './services/profile-interview.service.js';
import { AddProfileInterviewDto } from './dto/add-profile-interview.dto.js';
import { ProfileInterviewResponseDto } from './dto/profile-interview-response.dto.js';
import { UpdateProfileInterviewDto } from './dto/update-profile-interview.dto.js';

const PROFILE_ID_PARAM = { name: 'id', description: 'Profile identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' };
const PROFILE_INTERVIEW_ID_PARAM = {
  name: 'profileInterviewId',
  description: 'Profile interview record identifier (UUID)',
  example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
};

@ApiTags('profiles')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({ description: 'Missing, invalid or expired token' })
@UseGuards(JwtAuthGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(
    private readonly profileFindService: ProfileFindService,
    private readonly profileCreationService: ProfileCreationService,
    private readonly profileEditService: ProfileEditService,
    private readonly profileDeleteService: ProfileDeleteService,
    private readonly profileInterviewService: ProfileInterviewService,
  ) {}

  private transformSkills(skills: Array<{ requirement: { id: string; name: string; description: string | null } }>): ProfileSkillResponseDto[] {
    return skills.map((s) => ({
      skillId: s.requirement.id,
      skillName: s.requirement.name,
    }));
  }

  private transformCulturalFits(culturalFits: Array<{ culturalFit: { id: string; name: string; description: string | null } }>): ProfileCulturalFitResponseDto[] {
    return culturalFits.map((cf) => ({
      culturalFitId: cf.culturalFit.id,
      culturalFitName: cf.culturalFit.name,
    }));
  }

  private transformProfile(profile: ProfileWithRelations): ProfileResponseDto {
    return {
      ...profile,
      skills: this.transformSkills(profile.skills),
      culturalFits: this.transformCulturalFits(profile.culturalFits ?? []),
      educationalBackground: profile.educationalBackground.map(({ id, institution, degree, startDate, endDate, profileId }) => ({
        id,
        institution,
        degree,
        startDate,
        endDate,
        profileId,
      })),
      profileInterviews: profile.profileInterviews?.map((pi) => ({
        id: pi.id,
        interviewId: pi.interviewId,
        profileId: pi.profileId,
        transcript: pi.transcript,
        keyTakeaways: pi.keyTakeaways,
        startDate: pi.startDate,
        createdAt: pi.createdAt,
        updatedAt: pi.updatedAt,
      })) ?? [],
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all applicant profiles' })
  @ApiOkResponse({
    description: 'List of all applicant profiles',
    type: [ProfileResponseDto],
  })
  async findAll(): Promise<ProfileResponseDto[]> {
    const profiles = await this.profileFindService.findAll();
    return profiles.map((p) => this.transformProfile(p));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single applicant profile by id' })
  @ApiParam({ name: 'id', description: 'Profile identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'The requested profile', type: ProfileResponseDto })
  @ApiBadRequestResponse({ description: 'The id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'No profile exists with that id' })
  async findOne(@Param('id') id: string): Promise<ProfileResponseDto> {
    const profile = await this.profileFindService.findById(id);
    return this.transformProfile(profile);
  }

  @Post()
  @ApiOperation({ summary: 'Create an applicant profile' })
  @ApiCreatedResponse({
    description: 'The created profile',
    type: ProfileResponseDto,
  })
  @ApiBadRequestResponse({ description: 'The payload failed validation' })
  async create(
    @CurrentUser() requester: AuthPayload,
    @Body() dto: CreateProfileDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ProfileResponseDto> {
    const profile = await this.profileCreationService.create(dto);
    res.setHeader('Location', `/profiles/${profile.id}`);
    return this.transformProfile(profile);
  }

  @Post('upload-cv')
  @UseInterceptors(FileInterceptor('cv', { limits: { fileSize: MAX_CV_SIZE_BYTES, files: 1 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['cv'],
      properties: { cv: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload a PDF CV and create an applicant profile' })
  @ApiCreatedResponse({
    description: 'The created profile from CV',
    type: ProfileResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Missing or invalid PDF file' })
  @ApiPayloadTooLargeResponse({ description: 'The PDF exceeds the 5 MB upload limit' })
  async uploadCv(
    @CurrentUser() requester: AuthPayload,
    @UploadedFile(CvFilePipe) file: Express.Multer.File,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ProfileResponseDto> {
    const profile = await this.profileCreationService.createFromCv(file);
    res.setHeader('Location', `/profiles/${profile.id}`);
    return this.transformProfile(profile);
  }

  @Post(':id/add-interview')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record the transcript of a candidate in an interview (only the interview owner)' })
  @ApiParam(PROFILE_ID_PARAM)
  @ApiCreatedResponse({ description: 'The created profile interview', type: ProfileInterviewResponseDto })
  @ApiBadRequestResponse({ description: 'The payload failed validation, or the profile has not applied to the job opening of the interview step' })
  @ApiForbiddenResponse({ description: 'The interview belongs to another user' })
  @ApiNotFoundResponse({ description: 'Profile or interview not found' })
  @ApiConflictResponse({ description: 'The profile already has a record in this interview' })
  async addInterview(
    @CurrentUser() requester: AuthPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddProfileInterviewDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ProfileInterviewResponseDto> {
    const profileInterview = await this.profileInterviewService.addInterviewToProfile(requester, id, dto);
    res.setHeader('Location', `/profiles/${id}/interviews/${profileInterview.id}`);
    return profileInterview;
  }

  @Get(':id/interviews')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List the interview records of a profile' })
  @ApiParam(PROFILE_ID_PARAM)
  @ApiOkResponse({ description: 'The interview records of the profile', type: [ProfileInterviewResponseDto] })
  @ApiBadRequestResponse({ description: 'The id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'No profile exists with that id' })
  async findInterviews(@Param('id', new ParseUUIDPipe()) id: string): Promise<ProfileInterviewResponseDto[]> {
    return this.profileInterviewService.findByProfile(id);
  }

  @Get(':id/interviews/:profileInterviewId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get one interview record of a profile' })
  @ApiParam(PROFILE_ID_PARAM)
  @ApiParam(PROFILE_INTERVIEW_ID_PARAM)
  @ApiOkResponse({ description: 'The interview record', type: ProfileInterviewResponseDto })
  @ApiBadRequestResponse({ description: 'The id or profileInterviewId is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'No interview record with that id exists for this profile' })
  async findInterview(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('profileInterviewId', new ParseUUIDPipe()) profileInterviewId: string,
  ): Promise<ProfileInterviewResponseDto> {
    return this.profileInterviewService.findOne(id, profileInterviewId);
  }

  @Patch(':id/interviews/:profileInterviewId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an interview record of a profile (only the interview owner)' })
  @ApiParam(PROFILE_ID_PARAM)
  @ApiParam(PROFILE_INTERVIEW_ID_PARAM)
  @ApiOkResponse({ description: 'The updated interview record', type: ProfileInterviewResponseDto })
  @ApiBadRequestResponse({ description: 'The payload failed validation or an id is not a valid UUID' })
  @ApiForbiddenResponse({ description: 'The interview belongs to another user' })
  @ApiNotFoundResponse({ description: 'No interview record with that id exists for this profile' })
  async updateInterview(
    @CurrentUser() requester: AuthPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('profileInterviewId', new ParseUUIDPipe()) profileInterviewId: string,
    @Body() dto: UpdateProfileInterviewDto,
  ): Promise<ProfileInterviewResponseDto> {
    return this.profileInterviewService.update(requester, id, profileInterviewId, dto);
  }

  @Delete(':id/interviews/:profileInterviewId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an interview record of a profile (only the interview owner)' })
  @ApiParam(PROFILE_ID_PARAM)
  @ApiParam(PROFILE_INTERVIEW_ID_PARAM)
  @ApiNoContentResponse({ description: 'The interview record was deleted' })
  @ApiBadRequestResponse({ description: 'The id or profileInterviewId is not a valid UUID' })
  @ApiForbiddenResponse({ description: 'The interview belongs to another user' })
  @ApiNotFoundResponse({ description: 'No interview record with that id exists for this profile' })
  async removeInterview(
    @CurrentUser() requester: AuthPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('profileInterviewId', new ParseUUIDPipe()) profileInterviewId: string,
  ): Promise<void> {
    return this.profileInterviewService.remove(requester, id, profileInterviewId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update the provided fields of an applicant profile' })
  @ApiParam({ name: 'id', description: 'Profile identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'The updated profile', type: ProfileResponseDto })
  @ApiBadRequestResponse({ description: 'The payload failed validation' })
  @ApiNotFoundResponse({ description: 'No profile exists with that id' })
  async update(
    @CurrentUser() requester: AuthPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const profile = await this.profileEditService.update(id, dto);
    return this.transformProfile(profile);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an applicant profile' })
  @ApiParam({ name: 'id', description: 'Profile identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiNoContentResponse({ description: 'The profile was deleted' })
  @ApiBadRequestResponse({ description: 'The id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'No profile exists with that id' })
  async remove(
    @CurrentUser() requester: AuthPayload,
    @Param('id') id: string,
  ): Promise<void> {
    return this.profileDeleteService.remove(id);
  }
}
