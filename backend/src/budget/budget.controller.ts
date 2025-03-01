import { Body, Controller, Delete, Get, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget-dto';
import { Budget } from '../database/models/budget.model';
import { IdGuard } from 'src/common/guards/auth.guard';

@ApiTags('Счета')
@Controller('budgets')
export class BudgetController {
    constructor(private readonly budgetService: BudgetService) {}

    @ApiOperation({ summary: 'Создание счета' })
    @ApiResponse({ status: 200, description: 'Счет успешно создан', type: Budget })
    @ApiResponse({ status: 400, description: 'Некорректные данные' })
    @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
    @ApiBearerAuth()
    @UseGuards(IdGuard)
    @Post()
    async createBudget(@Body() createBudgetDto: CreateBudgetDto, @Request() req) {
        const userId = req.user.id; // Получение userId из JWT токена
        return this.budgetService.createBudget(createBudgetDto, userId);
    }

    @ApiOperation({ summary: 'Получение счетов пользователя' })
    @ApiResponse({ status: 200, description: 'Счета успешно получены', type: [Budget] })
    @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
    @ApiBearerAuth()
    @UseGuards(IdGuard)
    @Get()
    async getUserBudgets(@Request() req) {
        const userId = req.user.id;
        //return this.budgetService.getUserBudgets(userId);
    }

    @ApiOperation({ summary: 'Обновление суммы счета' })
    @ApiResponse({ status: 200, description: 'Сумма счета успешно обновлена', type: Budget })
    @ApiResponse({ status: 404, description: 'Счет пользователя этой категории не найден' })
    @ApiBearerAuth()
    @UseGuards(IdGuard)
    @Put()
    async updateBudgetAmount(@Body() updateBudgetDto: CreateBudgetDto, @Request() req) {
        const userId = req.user.id;
        //return this.budgetService.updateBudgetAmount(updateBudgetDto, userId);
    }

    @ApiOperation({ summary: 'Удаление счета' })
    @ApiResponse({ status: 200, description: 'Счет успешно удален' })
    @ApiResponse({ status: 404, description: 'Счет пользователя этой категории не найден' })
    @ApiBearerAuth()
    @UseGuards(IdGuard)
    @Delete()
    async deleteBudget(@Body() deleteBudgetDto: CreateBudgetDto, @Request() req) {
        const userId = req.user.id;
        //return this.budgetService.deleteBudget(deleteBudgetDto, userId);
    }
}