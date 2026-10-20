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
  ApiConflictResponse,
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
import { CreateSkillDto } from './dto/create-skill.dto.js';
import { UpdateSkillDto } from './dto/update-skill.dto.js';
import { SkillResponseDto } from './dto/skill-response.dto.js';
import { SkillCreationService } from './services/skill-creation.service.js';
import { SkillDeleteService } from './services/skill-delete.service.js';
import { SkillEditService } from './services/skill-edit.service.js';
import { SkillFindService } from './services/skill-find.service.js';
import { assertCanManageSkill } from './skill-access.js';

@ApiTags('skills')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({ description: 'Missing, invalid or expired token' })
@UseGuards(JwtAuthGuard)
@Controller('skills')
export class SkillsController {
  constructor(
    private readonly skillFindService: SkillFindService,
    private readonly skillCreationService: SkillCreationService,
    private readonly skillEditService: SkillEditService,
    private readonly skillDeleteService: SkillDeleteService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all skills' })
  @ApiOkResponse({
    description: 'List of all skills',
    type: [SkillResponseDto],
  })
  findAll(): Promise<SkillResponseDto[]> {
    return this.skillFindService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single skill by id' })
  @ApiParam({ name: 'id', description: 'Skill identifier', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'The requested skill', type: SkillResponseDto })
  @ApiBadRequestResponse({ description: 'The id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'No skill exists with that id' })
  async findOne(@Param('id') id: string): Promise<SkillResponseDto> {
    return this.skillFindService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a skill' })
  @ApiCreatedResponse({
    description: 'The created skill',
    type: SkillResponseDto,
  })
  @ApiBadRequestResponse({ description: 'The payload failed validation' })
  @ApiConflictResponse({ description: 'A skill with this name already exists' })
  async create(
    @CurrentUser() requester: AuthPayload,
    @Body() dto: CreateSkillDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SkillResponseDto> {
    const skill = await this.skillCreationService.create(dto);
    res.setHeader('Location', `/skills/${skill.id}`);
    return skill;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update the provided fields of a skill' })
  @ApiParam({ name: 'id', description: 'Skill identifier', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'The updated skill', type: SkillResponseDto })
  @ApiBadRequestResponse({ description: 'The payload failed validation' })
  @ApiNotFoundResponse({ description: 'No skill exists with that id' })
  @ApiConflictResponse({ description: 'A skill with this name already exists' })
  async update(
    @CurrentUser() requester: AuthPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSkillDto,
  ): Promise<SkillResponseDto> {
    assertCanManageSkill(requester);
    return this.skillEditService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a skill' })
  @ApiParam({ name: 'id', description: 'Skill identifier', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiNoContentResponse({ description: 'The skill was deleted' })
  @ApiBadRequestResponse({ description: 'The id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'No skill exists with that id' })
  async remove(
    @CurrentUser() requester: AuthPayload,
    @Param('id') id: string,
  ): Promise<void> {
    assertCanManageSkill(requester);
    return this.skillDeleteService.remove(id);
  }
}