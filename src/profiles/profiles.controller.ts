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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { CreateProfileDto } from './dto/create-profile.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ProfileResponseDto } from './dto/profile-response.dto.js';
import { ProfileSkillResponseDto } from './dto/profile-skill-response.dto.js';
import { ProfileCreationService } from './services/profile-creation.service.js';
import { ProfileDeleteService } from './services/profile-delete.service.js';
import { ProfileEditService } from './services/profile-edit.service.js';
import { ProfileFindService } from './services/profile-find.service.js';
import { ApplicantProfile } from '../generated/prisma/client.js';

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
  ) {}

  private transformSkills(skills: Array<{ requirement: { id: string; name: string; description: string | null } }>): ProfileSkillResponseDto[] {
    return skills.map((s) => ({
      skillId: s.requirement.id,
      skillName: s.requirement.name,
    }));
  }

  private transformProfile(profile: ApplicantProfile & { skills?: Array<{ requirement: { id: string; name: string; description: string | null } }> }): ProfileResponseDto {
    return {
      ...profile,
      skills: profile.skills ? this.transformSkills(profile.skills) : undefined,
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
  @UseInterceptors(FileInterceptor('cv'))
  @ApiOperation({ summary: 'Upload a PDF CV and create an applicant profile' })
  @ApiCreatedResponse({
    description: 'The created profile from CV',
    type: ProfileResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid file or failed to process CV' })
  async uploadCv(
    @CurrentUser() requester: AuthPayload,
    @UploadedFile() file: Express.Multer.File,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ProfileResponseDto> {
    if (!file || file.mimetype !== 'application/pdf') {
      throw new Error('Only PDF files are allowed');
    }
    const profile = await this.profileCreationService.createFromCv(file);
    res.setHeader('Location', `/profiles/${profile.id}`);
    return this.transformProfile(profile);
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