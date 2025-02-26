import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Category } from '../database/models/categories.model';
import { CreateCategoryDto } from './dto/create-category-dto';
import { ExpenseType } from 'src/common/enums/expense-type.enum';

@Injectable()
export class CategoriesService {
    constructor(@InjectModel(Category) private categRepository: typeof Category) {}

    async createCategory(dto: CreateCategoryDto, userId: number, isAdmin:boolean) {
        if (isAdmin) userId = 2; //потом сделать миграции для бд
        const category = await this.categRepository.create({ ...dto, user_id: +userId, expense_type: dto.expense_type as ExpenseType });
        await category.save();
        return category;
    }

    async findAllCategoriesByUser(userId: number, isAdmin: boolean) {
        if (isAdmin) {
            return this.categRepository.findAll(); // Администратор имеет доступ ко всем категориям
        }
        return this.categRepository.findAll({ where: { user_id: [userId, 2] } }); // Пользователь имеет доступ к своим категориям и категориям администратора
    }
}