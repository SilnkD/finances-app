import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
        return this.categRepository.findAll({ where: { user_id: [userId, 2] } });
    }

    async deleteCategory(userId: number, isAdmin: boolean, id: number) {
        let categoryDeleted;
        if (isAdmin) {
            categoryDeleted = await this.categRepository.destroy({ where: { id } });
        } else {
            const category = await this.categRepository.findOne({ where: { id } });
            if (!category) {
                throw new HttpException("Категория не найдена", HttpStatus.NOT_FOUND);
            }
            if (category.user_id === userId) {
                categoryDeleted = await this.categRepository.destroy({ where: { id } });
            } else {
                throw new HttpException("Вы не можете удалить чужую категорию", HttpStatus.FORBIDDEN);
            }
        }

        if (categoryDeleted === 1) {
            return `Категория с id ${id} удалена.`;
        } else {
            throw new HttpException('Категория не найдена', HttpStatus.NOT_FOUND);
        }
    }
}