import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Goal } from '../database/models/goals.model';
import { CreateGoalDto } from './dto/create-goal-dto';
import { Category } from '../database/models/categories.model';
import { GetGoalDto } from './dto/get-goal-dto';
import { Budget } from 'src/database/models/budget.model';

@Injectable()
export class GoalsService {
    constructor(
        @InjectModel(Goal) private goalRepository: typeof Goal,
        @InjectModel(Budget) private budgetRepository: typeof Budget,
        @InjectModel(Category) private categoryRepository: typeof Category,
    ) {}

    async createGoal(dto: CreateGoalDto, userId: number) {
        const budget = await this.budgetRepository.findOne({ where: { id: dto.budget_id } });
        if (!budget) {
            throw new HttpException('Счет не найден', HttpStatus.NOT_FOUND);
        }

        const goal = await this.goalRepository.create({ ...dto, user_id: userId });
        await goal.save();
        return goal;
    }

    async displayGoal(goals) {
        const displayedGoals: GetGoalDto[] = [];
    
        for (const goal of goals) {
            const category = await this.categoryRepository.findByPk(goals.budget.usercategory.category_id);
    
            if (category) displayedGoals.push({
                id: goal.id,
                category_name: category.name,
                user_id: goal.user_id,
                name: goal.name,
                target_amount: goal.target_amount,
                current_amount: goal.current_amount,
                start_date: goal.start_date,
                end_date: goal.end_date
            });
        }
    
        return displayedGoals;
    }

    async getGoals(): Promise<GetGoalDto[]> {
        const goals = await this.goalRepository.findAll({ include: [Category] });
        return this.displayGoal(goals);
    }

    async getUserGoals(userId: number): Promise<GetGoalDto[]> {
        const goals = await this.goalRepository.findAll({ where: { user_id: userId }, include: [Category] });
        return this.displayGoal(goals);
    }

    async deleteGoal(userId: number, id: number) {
        const goal = await this.goalRepository.findOne({ where: { id } });
        if (!goal) {
            throw new HttpException('Цель не найдена', HttpStatus.NOT_FOUND);
        }

        if (goal.user_id !== userId) {
            throw new HttpException('Вы не можете удалить чужую цель', HttpStatus.FORBIDDEN);
        }

        await this.goalRepository.destroy({ where: { id } });
        return `Цель с id ${id} удалена.`;
    }

    async updateGoal(id: number, dto: CreateGoalDto, userId: number): Promise<GetGoalDto | HttpException> {
        const goal = await this.goalRepository.findOne({ where: { id } });
        if (!goal) {
            throw new HttpException('Цель не найдена', HttpStatus.NOT_FOUND);
        }

        if (goal.user_id !== userId) {
            throw new HttpException('Вы не можете изменить чужую цель', HttpStatus.FORBIDDEN);
        }

        const budget = await this.budgetRepository.findOne({ where: { id: dto.budget_id } });
        if (!budget) {
            throw new HttpException('Категория не найдена', HttpStatus.NOT_FOUND);
        }

        await this.goalRepository.update(dto, { where: { id } });
        const updatedGoal = await this.goalRepository.findOne({ where: { id }, include: [Category] });

        if (updatedGoal !== null) {
            const category = await this.categoryRepository.findByPk(updatedGoal.budget.usercategory.category_id);
            if (category) return {
                id: updatedGoal.id,
                category_name: category.name,
                user_id: updatedGoal.user_id,
                name: updatedGoal.name,
                target_amount: updatedGoal.target_amount,
                current_amount: updatedGoal.budget.amount,
                start_date: updatedGoal.start_date,
                end_date: updatedGoal.end_date
            };
        }

        throw new HttpException('Цель не найдена', HttpStatus.NOT_FOUND);
    }
}