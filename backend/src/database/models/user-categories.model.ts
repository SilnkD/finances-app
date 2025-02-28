import { Table, Model, Column, DataType, ForeignKey } from 'sequelize-typescript';
import { User } from './users.model';
import { Category } from './categories.model';
import { ApiProperty } from '@nestjs/swagger';

interface UserCategCreationAttrs {
  user_id: number;
  category_id: number;
  percentage: number;
}

@Table({ tableName: 'user_categories', timestamps: false  })
export class UserCategory extends Model<UserCategory, UserCategCreationAttrs> {
  @ForeignKey(() => User)
  @ApiProperty({ example: '1', description: 'ID пользователя' })
  @Column({ type: DataType.INTEGER, allowNull: false })
  user_id: number;

  @ForeignKey(() => Category)
  @ApiProperty({ example: '1', description: 'ID категории' })
  @Column({ type: DataType.INTEGER, allowNull: false })
  category_id: number;

  @ApiProperty({ example: '0', description: 'Процент трат этой категории по умолчанию 0%' })
  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
  percentage: number;
}