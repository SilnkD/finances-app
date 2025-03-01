import { Body, Controller, Post, UseGuards, Request, Get, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget-dto';
import { GetBudgetDto } from './dto/get-budget-dto';
import { IdGuard } from 'src/common/guards/auth.guard';

@ApiTags('Бюджеты')
@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @ApiOperation({ summary: 'Создание бюджета' })
  @ApiResponse({ status: 200, description: 'Бюджет успешно создан', type: GetBudgetDto })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @UseGuards(IdGuard)
  @ApiBearerAuth()
  @Post()
  async createBudget(@Body() createBudgetDto: CreateBudgetDto, @Request() req) {
    const userId = req.user.id;  // Получение userId из JWT токена
    return this.budgetService.createBudget(createBudgetDto, userId);
  }

  @ApiOperation({ summary: 'Получение бюджетов пользователя' })
  @ApiResponse({ status: 200, description: 'Бюджеты пользователя успешно получены', type: [GetBudgetDto] })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @UseGuards(IdGuard)
  @ApiBearerAuth()
  @Get()
  async getUserBudgets(@Request() req) {
    const userId = req.user.id;
    return this.budgetService.getUserBudgets(userId);
  }

  @ApiOperation({ summary: 'Обновление суммы бюджета' })
  @ApiResponse({ status: 200, description: 'Сумма бюджета успешно обновлена', type: GetBudgetDto })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 404, description: 'Категория не найдена' })
  @UseGuards(IdGuard)
  @ApiBearerAuth()
  @Put()
  async updateBudgetAmount(@Body() updateBudgetDto: CreateBudgetDto, @Request() req) {
    const userId = req.user.id;
    return this.budgetService.updateBudgetAmount(updateBudgetDto, userId);
  }
}