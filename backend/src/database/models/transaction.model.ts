import { ApiProperty } from "@nestjs/swagger";
import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Budget } from "./budget.model";

interface TransactionCreationAttrs {
    amount: number;
    date: string;
    description: string;
    budget_id: number;
}

@Table({ tableName: 'transactions', timestamps: false })
export class Transaction extends Model<Transaction, TransactionCreationAttrs> {
    @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
    @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
    id: number;

    @ApiProperty({ example: '1', description: 'Счет, с которого совершена транзакция' })
    @ForeignKey(() => Budget)
    @Column({ type: DataType.INTEGER, allowNull: false })
    budget_id: number;

    @BelongsTo(() => Budget)
    budget: Budget;
    
    @ApiProperty({ example: 1000, description: 'Сумма транзакции (BYN)' })
    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    amount: number;

    @ApiProperty({ example: new Date().toISOString(), description: 'Дата совершения транзакции' })
    @Column({ type: DataType.DATE, allowNull: false, defaultValue: new Date() })
    date: string;

    @ApiProperty({ example: 'Продукты', description: 'Название транзакции' })
    @Column({ type: DataType.STRING, allowNull: false })
    description: string;
}