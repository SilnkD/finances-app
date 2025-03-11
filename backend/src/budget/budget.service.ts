import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Budget } from 'src/database/models/budget.model';
import { CreateBudgetDto } from './dto/create-budget-dto';
import { Category } from 'src/database/models/categories.model';
import { UserCategory } from 'src/database/models/user-categories.model';
import { GetBudgetDto } from './dto/get-budget-dto';

@Injectable()
export class BudgetService {
    constructor (
        @InjectModel(Budget) private budgetRepository: typeof Budget,
        @InjectModel(Category) private categoryRepository: typeof Category,
        @InjectModel(UserCategory) private userCategoryRepository: typeof UserCategory,
    ) {}

    async displayBudget(budget) {
        const finalUserCategory = await this.userCategoryRepository.findOne({ where: { user_id: budget.user_id } });
        const categ = await this.categoryRepository.findByPk(finalUserCategory?.category_id);
        
        if (finalUserCategory && categ) {
            return {
                id: budget.id,
                category_name: categ.name,
                amount: budget.amount
            };
        } else if (!categ) {
            throw new HttpException('Категория не найдена', HttpStatus.NOT_FOUND);
        } else {
            throw new HttpException('Категория пользователя не найдена', HttpStatus.NOT_FOUND);
        }
    }    

    async createBudget(dto: CreateBudgetDto, userId): Promise<GetBudgetDto> {
        const category = await this.categoryRepository.findOne({ where: { id: dto.category_id } });
        console.log('Category:', category);
      
        const userCategory = await this.userCategoryRepository.findOne({ where: { user_id: userId, category_id: dto.category_id } });
        console.log('UserCategory:', userCategory);
      
        if (category==null) {
          throw new HttpException('Категория не найдена', HttpStatus.NOT_FOUND);
        } 
        if (userCategory==null) {
          throw new HttpException('Пользователь не указал процент трат категории', HttpStatus.NOT_FOUND);
        }
        let user_id = userCategory.id;
        let amount = dto.amount
        const budget = await this.budgetRepository.create({ user_id, amount });
        return this.displayBudget(budget);
    }        

    async getUserBudgets(user_id) {
        const userCategories = await this.userCategoryRepository.findAll({where: {user_id}, include: {all: true}});
        const displayBudgets: GetBudgetDto[] = [];
        for (const userCategory of userCategories) {
            const category = await this.categoryRepository.findByPk(userCategory.category_id);
            if (category) displayBudgets.push({
                id: userCategory.budget.id,
                category_name: category.name,
                amount: userCategory.budget.amount
            });
        }
        return displayBudgets;
    }

    async updateBudgetAmount(budget_id, amount): Promise<GetBudgetDto> {
        await this.budgetRepository.update({ amount }, { where: { id: budget_id } });
        const updatedBudget = await this.budgetRepository.findOne({ where: { id: budget_id } });
        return this.displayBudget(updatedBudget);
    }    

    async getBudget(user_id: number, category_id: number): Promise<GetBudgetDto> {
        const userCategory = await this.userCategoryRepository.findOne({ where: { user_id, category_id } });
    
        if (!userCategory) {
            throw new HttpException('Категория пользователя не найдена', HttpStatus.NOT_FOUND);
        }
    
        const budget = await this.budgetRepository.findOne({ where: { user_id } }); // Используем user_id для поиска бюджета
    
        if (!budget) {
            throw new HttpException('Обновленный счет не найден', HttpStatus.NOT_FOUND);
        }
    
        return this.displayBudget(budget);
    }    
}