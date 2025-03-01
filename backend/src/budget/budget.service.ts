import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Budget } from 'src/database/models/budget.model';
import { CreateBudgetDto } from './dto/create-budget-dto';
import { Category } from 'src/database/models/categories.model';
import { User } from 'src/database/models/users.model';

@Injectable()
export class BudgetService {
    constructor (
        @InjectModel(Budget) private budgetRepository: typeof Budget,
        @InjectModel(Category) private categoryRepository: typeof Category,
    ) {}

    async displayBudget(budget) {
        return {
            id: budget.id,
            user: budget.user.username,
            category: budget.category.name,
            amount: budget.amount
        };
    }

    async createBudget(dto: CreateBudgetDto, user_id) {
        const category = await this.categoryRepository.findOne({ where: { id: dto.category_id } });
        if (!category) {
            throw new HttpException('Категория не найдена', HttpStatus.NOT_FOUND);
        }

        const budget = await this.budgetRepository.create({ ...dto, user_id: user_id });
        await budget.save();
        return this.displayBudget(budget);
    }
/*
    async getUserBudgets(user_id) {
        const budgets = await this.budgetRepository.findAll({ where: { user_id }, include: [Category, User] });
        return Promise.all(budgets.map(budget => this.displayBudget(budget)));
    }

    async updateBudgetAmount(dto: CreateBudgetDto, user_id) {
        const budget = await this.budgetRepository.findOne({ where: { category_id: dto.category_id, user_id: user_id } });
        if (!budget) {
            throw new HttpException('Счет пользователя этой категории не найден', HttpStatus.NOT_FOUND);
        }
        await this.budgetRepository.update({ amount: dto.amount }, { where: { id: budget.id } });
        return this.displayBudget(budget);
    }

    async deleteBudget(dto: CreateBudgetDto, user_id) {
        const budget = await this.budgetRepository.findOne({ where: { category_id: dto.category_id, user_id: user_id } });
        if (!budget) {
            throw new HttpException('Счет пользователя этой категории не найден', HttpStatus.NOT_FOUND);
        }
        const budgetDeleted = await this.budgetRepository.destroy({ where: { id: budget.id } });
        if (budgetDeleted === 1) {
            return `Счет с id ${budget.id} удален.`;
        } else {
            throw new HttpException('Ошибка при удалении счета', HttpStatus.NOT_MODIFIED);
        }
    }*/
}