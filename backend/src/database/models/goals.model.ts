import { ApiProperty } from "@nestjs/swagger";
import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from "sequelize-typescript";
import { User } from "./users.model";
import { Category } from "./categories.model";

interface GoalCreationAttrs {
    name: string;
    target_amount: number;
    current_amount: number;
    start_date: string;
    end_date: string;
    user_id: number;
    category_id: number;
}

@Table({ tableName: 'goals', timestamps: false })
export class Goal extends Model<Goal, GoalCreationAttrs> {
    @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
    @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
    id: number;

    @ApiProperty({ example: '1', description: 'Создатель цели' })
    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false })
    user_id: number;

    @BelongsTo(() => User)
    user: User;

    @ApiProperty({ example: '1', description: 'Категория цели' })
    @ForeignKey(() => Category)
    @Column({ type: DataType.INTEGER, allowNull: false })
    category_id: number;

    @BelongsTo(() => Category)
    category: Category;

    @ApiProperty({ example: 'Поездка на море', description: 'Название цели' })
    @Column({ type: DataType.STRING, allowNull: false })
    name: string;
    
    @ApiProperty({ example: 1000, description: 'Размер финансовой цели (BYN)' })
    @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
    target_amount: number;
    
    @ApiProperty({ example: 800, description: 'Текущие накопления (BYN)' })
    @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
    current_amount: number;

    @ApiProperty({ example: new Date().toISOString(), description: 'Дата начала накоплений' })
    @Column({ type: DataType.DATE, allowNull: false, defaultValue: new Date() })
    start_date: string;

    @ApiProperty({ example: new Date().toISOString(), description: 'Финальная дата' })
    @Column({ type: DataType.DATE, allowNull: false, defaultValue: new Date() })
    end_date: string;
}