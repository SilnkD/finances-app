import { ApiProperty } from "@nestjs/swagger";
import { Column, DataType, Model, Table, BelongsToMany } from "sequelize-typescript";
import { ExpenseType } from "src/common/enums/expense-type.enum";
import { User } from "./users.model";
import { UserCategory } from "./user-categories.model";
import { AccessType } from "src/common/enums/access-type.enum";

interface CategoryCreationAttrs {
    name: string;
    expense_type: ExpenseType;
    image_url: string;
}

@Table({ tableName: 'categories', timestamps: false })
export class Category extends Model<Category, CategoryCreationAttrs> {
    @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
    @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
    id: number;

    @ApiProperty({ example: 'Продукты питания', description: 'Название категории' })
    @Column({ type: DataType.STRING, allowNull: false })
    name: string;
    
    @ApiProperty({ example: 'EXPENSE', description: 'Тип категории (GOAL/EXPENSE/INCOME)' })
    @Column({ type: DataType.ENUM, values: Object.values(ExpenseType), allowNull: false, defaultValue: ExpenseType.Expenses })
    expense_type: ExpenseType;
    
    @ApiProperty({ example: 'PUBLIC', description: 'Тип доступа (PUBLIC/PRIVATE)' })
    @Column({ type: DataType.ENUM, values: Object.values(AccessType), allowNull: false, defaultValue: AccessType.Private })
    access_type: AccessType;

    @ApiProperty({ example: 'https://i.pinimg.com/736x/be/61/8b/be618b13e9580a7f49aa1bf8e55371ff.jpg', description: 'Ссылка на изображение' })
    @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'https://i.pinimg.com/736x/a2/8e/c1/a28ec1ef2f8ab9744dea1029a33edcbf.jpg' })
    image_url: string;

    @BelongsToMany(() => User, () => UserCategory)
    users: User[];
}