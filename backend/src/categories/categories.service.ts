import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Category } from '../database/models/categories.model';
import { CreateCategoryDto } from './dto/create-category-dto';
import { ExpenseType } from 'src/common/enums/expense-type.enum';
import { UserCategory } from 'src/database/models/user-categories.model';
import { AccessType } from 'src/common/enums/access-type.enum';
import { Op } from 'sequelize';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectModel(Category) private categRepository: typeof Category,
        @InjectModel(UserCategory) private userCategoryRepository: typeof UserCategory,
    ) {}

    async transformCategoryData(category) {
        return {
            id: category.id,
            name: category.name,
            expense_type: category.expense_type,
            image_url: category.image_url,
            users: category.users.map(user => ({
                user_id: user.UserCategory.user_id,
                category_id: user.UserCategory.category_id,
                percentage: user.UserCategory.percentage,
            }))
        };
    }

    async createCategory(dto: CreateCategoryDto, user_id: number, isAdmin: boolean) {
        user_id = isAdmin ? 1 : user_id; // потом сделать миграции для бд
        console.log(user_id);

        const category = await this.categRepository.create({
            name: dto.name,
            expense_type: dto.expense_type as ExpenseType,
            image_url: dto.image_url
        });

        if (!isAdmin) {
            await this.userCategoryRepository.create({
                user_id: user_id,
                category_id: category.id,
                percentage: dto.percentage
            });
        } else {
            category.access_type = AccessType.Public;
            category.save();
        }
        return this.transformCategoryData(await this.categRepository.findByPk(category.id, {include: {all:true}}));
    }

    async assignCategory(category_id: number, user_id: number, percentage: number) {
        const category = await this.categRepository.findByPk(category_id);
        if (!category) {
            throw new HttpException('Категория не найдена', HttpStatus.NOT_FOUND);
        }

        const userCategory = await this.userCategoryRepository.findOne({
            where: { user_id, category_id }
        });

        if (userCategory) {
            throw new HttpException('Категория уже присвоена пользователю', HttpStatus.BAD_REQUEST);
        }

        await this.userCategoryRepository.create({
            user_id: user_id,
            category_id: category_id,
            percentage: percentage
        });

        return this.transformCategoryData(await this.categRepository.findByPk(category_id, { include: { all: true } }));
    }

    async findAllCategoriesByUser(user_id: number, isAdmin: boolean) {
        if (isAdmin) {
            const categories = await this.categRepository.findAll({ include: { all: true } }); // Администратор имеет доступ ко всем категориям
            return categories.map(category => this.transformCategoryData(category));
        }
        const userCategories = await this.userCategoryRepository.findAll({ where: { user_id } });
        const categoryIds = userCategories.map(userCategory => userCategory.category_id);
        const categories = await this.categRepository.findAll({
            where: {
                [Op.or]: [
                    { id: categoryIds },
                    { access_type: 'Public' }
                ]
            },
            include: { all: true }
        })
        return categories.map(category => this.transformCategoryData(category));
    }    

    async deleteCategory(user_id: number, isAdmin: boolean, id: number) {
        let categoryDeleted, userCategoryDeleted;
        const category = await this.categRepository.findByPk(id);
        if (isAdmin || category?.access_type==AccessType.Private) {
            categoryDeleted = await this.categRepository.destroy({ where: { id } });
        } else {
            userCategoryDeleted = await this.userCategoryRepository.destroy({ where: { user_id, category_id: id } });
        }

        if (categoryDeleted === 1) {
            return `Категория с id ${id} удалена.`;
        } else if (userCategoryDeleted === 1) {
            return `Категория пользователя с id ${id} удалена.`
        } else {
            throw new HttpException('Категория не найдена', HttpStatus.NOT_FOUND);
        }
    }

    async updateCategory(id: number, dto: CreateCategoryDto, user_id: number, isAdmin: boolean) {
        let categoryUpdated, userCategoryUpdated;
        const category = await this.categRepository.findByPk(id);
    
        if (isAdmin || category?.access_type == AccessType.Private) {
            categoryUpdated = await this.categRepository.update(dto, { where: { id } });
        } else {
            userCategoryUpdated = await this.userCategoryRepository.update(
                { percentage: dto.percentage }, 
                { where: { user_id, category_id: id } }
            );
        }
    
        if (categoryUpdated) {
            return await this.categRepository.findOne({ where: { id } });
        } else if (userCategoryUpdated) {
            return `Категория пользователя с id ${id} обновлена.`;
        } else {
            throw new HttpException('Категория не найдена', HttpStatus.NOT_FOUND);
        }
    }    
}