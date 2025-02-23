import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Category } from './categories.model';
import { CreateCategoryDto } from './dto/create-category-dto';
import { ExpenseType } from 'src/common/enums/expense-type.enum';

@Injectable()
export class CategoriesService {
    constructor(@InjectModel(Category) private categRepository: typeof Category) {}

    async createCategory(dto: CreateCategoryDto, userId: number) {
        const category = await this.categRepository.create({ ...dto, user_id: +userId, expense_type: dto.expense_type as ExpenseType });
        await category.save();
        return category;
    }
}