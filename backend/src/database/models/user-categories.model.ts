import { Table, Model, Column, DataType, ForeignKey, HasOne, BelongsTo } from 'sequelize-typescript';
import { User } from './users.model';
import { Category } from './categories.model';
import { ApiProperty } from '@nestjs/swagger';
import { Budget } from './budget.model';

interface UserCategCreationAttrs {
  user_id: number;
  category_id: number;
  percentage: number;
}

@Table({ tableName: 'user_categories', timestamps: false  })
export class UserCategory extends Model<UserCategory, UserCategCreationAttrs> {
  @ApiProperty({example: '1', description: 'Уникальный идентификатор'})
  @Column({type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true})
  id:number;

  @ForeignKey(() => User)
  @ApiProperty({ example: '1', description: 'ID пользователя' })
  @Column({ type: DataType.INTEGER, allowNull: false })
  user_id: number;
  
  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Category)
  @ApiProperty({ example: '1', description: 'ID категории' })
  @Column({ type: DataType.INTEGER, allowNull: false })
  category_id: number;

  @BelongsTo(() => Category)
  category: Category;

  @ApiProperty({ example: '0', description: 'Процент трат этой категории по умолчанию 0%' })
  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
  percentage: number;

  @HasOne(()=>Budget)
  budget: Budget;
}