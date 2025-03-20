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
        const finalUserCategory = await this.userCategoryRepository.findOne({ where: { id: budget.owner_id } });
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
        const userCategory = await this.userCategoryRepository.findOne({ where: { user_id: userId, category_id: dto.category_id } });

        if (category == null) {
            throw new HttpException('Категория не найдена', HttpStatus.NOT_FOUND);
        } 
        if (userCategory == null) {
            throw new HttpException('Пользователь не указал процент трат категории', HttpStatus.NOT_FOUND);
        }
    
        let owner_id = userCategory.id;
        let amount = dto.amount;

        const existingBudget = await this.budgetRepository.findOne({ where: { owner_id } });
        if (existingBudget) {
            throw new HttpException('Счет для данной категории уже существует', HttpStatus.BAD_REQUEST);
        }
    
        const budget = await this.budgetRepository.create({ owner_id, amount });
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

    async updateBudgetAmount(dto: CreateBudgetDto, userId: number): Promise<GetBudgetDto> {
        const category = await this.categoryRepository.findOne({ where: { id: dto.category_id } });
        if (!category) {
            throw new HttpException('Категория не найдена', HttpStatus.NOT_FOUND);
        }
    
        const userCategory = await this.userCategoryRepository.findOne({ where: { user_id: userId, category_id: dto.category_id } });
        if (!userCategory) {
            throw new HttpException('Пользователь не указал процент трат категории', HttpStatus.NOT_FOUND);
        }
    
        const budget = await this.budgetRepository.findOne({ where: { owner_id: userCategory.id } });
        if (!budget) {
            throw new HttpException('Счет для данной категории не найден', HttpStatus.NOT_FOUND);
        }
    
        budget.amount = dto.amount;
        const updatedBudget = await budget.save();
    
        return this.displayBudget(updatedBudget);
    }     
    
    async deleteBudget(id: number, userId: number): Promise<{ message: string }> {
        const budget = await this.budgetRepository.findByPk(id);
        if (!budget) {
            throw new HttpException('Счет не найден', HttpStatus.NOT_FOUND);
        }
        const userCategory = await this.userCategoryRepository.findByPk(budget?.owner_id);
        if (userCategory && userCategory.user_id!=userId) {
            throw new HttpException('Вы не можете удалить чужой счет', HttpStatus.FORBIDDEN);
        }
        await this.budgetRepository.destroy({ where: { id } });
    
        return { message: `Счет ${id} успешно удалён` };
    }    
}