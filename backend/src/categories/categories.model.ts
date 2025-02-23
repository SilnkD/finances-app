import { ApiProperty } from "@nestjs/swagger";
import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from "sequelize-typescript";
import { ExpenseType } from "src/common/enums/expense-type.enum";
import { User } from "src/users/users.model";

interface CategoryCreationAttrs {
    name: string;
    expense_type: ExpenseType;
    image_url: string;
    default_percentage: number;
    user_id: number;
}

@Table({ tableName: 'categories', timestamps: false })
export class Category extends Model<Category, CategoryCreationAttrs> {
    @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
    @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
    id: number;

    @ApiProperty({ example: '1', description: 'Создатель категории' })
    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false })
    user_id: number;

    @BelongsTo(() => User)
    user: User;

    @ApiProperty({ example: 'Продукты питания', description: 'Название категории' })
    @Column({ type: DataType.STRING, allowNull: false })
    name: string;
    
    @ApiProperty({ example: 'EXPENSE', description: 'Тип категории (GOAL/EXPENSE/INCOME)' })
    @Column({ type: DataType.ENUM, values: Object.values(ExpenseType), allowNull: false, defaultValue: ExpenseType.Expenses })
    expense_type: ExpenseType;

    @ApiProperty({ example: 'https://i.pinimg.com/736x/be/61/8b/be618b13e9580a7f49aa1bf8e55371ff.jpg', description: 'Ссылка на изображение' })
    @Column({ type: DataType.STRING, unique: true, allowNull: false, defaultValue: 'https://i.pinimg.com/736x/a2/8e/c1/a28ec1ef2f8ab9744dea1029a33edcbf.jpg' })
    image_url: string;

    @ApiProperty({ example: '0', description: 'Процент трат этой категории по умолчанию 0%' })
    @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
    default_percentage: number;
}