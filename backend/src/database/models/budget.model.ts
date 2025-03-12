import { ApiProperty } from "@nestjs/swagger";
import { Column, DataType, Model, Table, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import { UserCategory } from "./user-categories.model";
import { Goal } from "./goals.model";
import { Transaction } from "./transaction.model";

interface BudgetCreationAttrs {
    amount: number;
    user_id: number;
}

@Table({ tableName: 'budgets', timestamps: false })
export class Budget extends Model<Budget, BudgetCreationAttrs> {
    @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
    @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
    id: number;

    @ApiProperty({ example: '1', description: 'Владелец счета' })
    @ForeignKey(() => UserCategory)
    @Column({ type: DataType.INTEGER, allowNull: false })
    owner_id: number;

    @BelongsTo(() => UserCategory)
    usercategory: UserCategory;
    
    @ApiProperty({ example: 1000, description: 'Сумма на счету (BYN)' })
    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    amount: number;
        
    @HasMany(()=>Goal)
    goals: Goal[];
    
    @HasMany(()=>Transaction)
    transactions: Transaction[];
}