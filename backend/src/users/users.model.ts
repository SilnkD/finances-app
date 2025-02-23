import { ApiProperty } from "@nestjs/swagger";
import { Column, DataType, Model, Table } from "sequelize-typescript";
import { Role } from "../roles/roles.enum";

interface UserCreationAttrs {
    email: string;
    password: string;
}

@Table({tableName:'users'})
export class User extends Model <User, UserCreationAttrs> {
    @ApiProperty({example: '1', description: 'Уникальный идентификатор'})
    @Column({type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true})
    id:number;

    @ApiProperty({example: 'example@gmail.com', description: 'Электронная почта'})
    @Column({type: DataType.STRING, unique: true, allowNull: false})
    email: string;

    @ApiProperty({example: 'password123', description: 'Пароль'})
    @Column({type: DataType.STRING, allowNull: false})
    password: string;

    @ApiProperty({example: 'ADMIN', description: 'Роль пользователя (ADMIN/USER)'})
    @Column({type: DataType.ENUM, values: Object.values(Role), allowNull: false, defaultValue: Role.User})
    role: Role;
}