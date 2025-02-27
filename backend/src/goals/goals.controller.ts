import { Body, Controller, Post, UseGuards, Request, Get, Delete, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal-dto';
import { Goal } from '../database/models/goals.model';
import { IdGuard } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';

@ApiTags('Цели')
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @ApiOperation({ summary: 'Создание цели' })
  @ApiResponse({ status: 200, description: 'Цель успешно создана', type: Goal })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @UseGuards(IdGuard)
  @ApiBearerAuth()
  @Post()
  async createGoal(@Body() createGoalDto: CreateGoalDto, @Request() req) {
    const userId = req.user.id;  // Получение userId из JWT токена
    return this.goalsService.createGoal(createGoalDto, userId);
  }

  @ApiOperation({ summary: 'Получение целей' })
  @ApiResponse({ status: 200, description: 'Цели успешно получены', type: [Goal] })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 403, description: 'Доступ только для администратора' })
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @Get()
  async getGoals() {
    return this.goalsService.getGoals();
  }

  @ApiOperation({ summary: 'Получение целей пользователя' })
  @ApiResponse({ status: 200, description: 'Цели пользователя успешно получены', type: [Goal] })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @UseGuards(IdGuard)
  @ApiBearerAuth()
  @Get('user')
  async getUserGoals(@Request() req) {
    const userId = req.user.id;
    return this.goalsService.getUserGoals(userId);
  }

  @ApiOperation({ summary: 'Удаление цели' })
  @ApiResponse({ status: 200, description: 'Цель успешно удалена' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 403, description: 'Вы не можете удалить чужую цель' })
  @ApiResponse({ status: 404, description: 'Цель не найдена' })
  @UseGuards(IdGuard)
  @ApiBearerAuth()
  @Delete('/delete/:id')
  async deleteGoal(@Request() req, @Param('id') id: number) {
    const userId = req.user.id;
    return this.goalsService.deleteGoal(userId, id);
  }

  @ApiOperation({ summary: 'Обновление цели' })
  @ApiResponse({ status: 200, description: 'Цель успешно обновлена', type: Goal })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 403, description: 'Вы не можете изменить чужую цель' })
  @ApiResponse({ status: 404, description: 'Цель не найдена' })
  @ApiResponse({ status: 404, description: 'Категория не найдена' })
  @UseGuards(IdGuard)
  @ApiBearerAuth()
  @Put('/:id')
  async updateGoal(@Body() updateGoalDto: CreateGoalDto, @Request() req, @Param('id') id: number) {
    const userId = req.user.id;
    return this.goalsService.updateGoal(id, updateGoalDto, userId);
  }
}