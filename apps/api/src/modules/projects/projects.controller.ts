import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    ForbiddenException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '@aeo-live/shared';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Post()
    async create(@CurrentUser() user: AuthUser, @Body() dto: CreateProjectDto) {
        if (!user.organizationId) {
            throw new ForbiddenException('User is not part of an organization');
        }
        const project = await this.projectsService.create(user.organizationId, dto);
        return {
            success: true,
            data: project,
        };
    }

    @Get()
    async findAll(@CurrentUser() user: AuthUser) {
        if (!user.organizationId) {
            throw new ForbiddenException('User is not part of an organization');
        }
        const projects = await this.projectsService.findAll(user.organizationId);
        return {
            success: true,
            data: projects,
        };
    }

    @Get(':id')
    async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        if (!user.organizationId) {
            throw new ForbiddenException('User is not part of an organization');
        }
        const project = await this.projectsService.findById(id, user.organizationId);
        return {
            success: true,
            data: project,
        };
    }

    @Patch(':id')
    async update(
        @CurrentUser() user: AuthUser,
        @Param('id') id: string,
        @Body() dto: UpdateProjectDto
    ) {
        if (!user.organizationId) {
            throw new ForbiddenException('User is not part of an organization');
        }
        const project = await this.projectsService.update(id, user.organizationId, dto);
        return {
            success: true,
            data: project,
        };
    }

    @Delete(':id')
    async delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        if (!user.organizationId) {
            throw new ForbiddenException('User is not part of an organization');
        }
        await this.projectsService.delete(id, user.organizationId);
        return {
            success: true,
            data: { message: 'Project deleted successfully' },
        };
    }
}
