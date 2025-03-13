import { Body, Controller, Post, UseGuards, Request, Get, Param, Put, Delete } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget-dto';
import { GetBudgetDto } from './dto/get-budget-dto';
import { IdGuard } from 'src/common/guards/auth.guard';

@ApiTags('Счета')
@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @ApiOperation({ summary: 'Создание счета' })
  @ApiResponse({ status: 201, description: 'Счет успешно создан', type: GetBudgetDto })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @UseGuards(IdGuard)
  @ApiBearerAuth()
  @Post()
  async createBudget(@Body() createBudgetDto: CreateBudgetDto, @Request() req) {
    const userId = req.user.id;  // Получение userId из JWT токена
    return this.budgetService.createBudget(createBudgetDto, userId);
  }

  @ApiOperation({ summary: 'Получение счетов пользователя' })
  @ApiResponse({ status: 200, description: 'Счета пользователя успешно получены', type: [GetBudgetDto] })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @UseGuards(IdGuard)
  @ApiBearerAuth()
  @Get()
  async getUserBudgets(@Request() req) {
    const userId = req.user.id;
    return this.budgetService.getUserBudgets(userId);
  }

  @ApiOperation({ summary: 'Обновление суммы счета' })
  @ApiResponse({ status: 200, description: 'Сумма счета успешно обновлена', type: GetBudgetDto })
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

  @ApiOperation({ summary: 'Удаление счета' })
  @ApiResponse({ status: 200, description: 'Счет успешно удалён' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 403, description: 'Пользователь не может удалить этот счет' })
  @ApiResponse({ status: 404, description: 'Счет не найден' })
  @UseGuards(IdGuard)
  @ApiBearerAuth()
  @Delete(':id')
  async deleteBudget(@Param('id') id: number, @Request() req): Promise<{ message: string }> {
    const userId = req.user.id;
    return this.budgetService.deleteBudget(id, userId);
  }
}