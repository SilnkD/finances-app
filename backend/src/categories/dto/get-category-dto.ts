import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString, IsUrl, Length, IsNumber } from "class-validator";
import { ExpenseType } from "src/common/enums/expense-type.enum";

export class UserCategoryDto {
    @ApiProperty({ example: '2', description: 'ID пользователя' })
    @IsNumber({}, { message: 'ID пользователя должен быть числом' })
    readonly user_id: number;

    @ApiProperty({ example: '13', description: 'ID категории' })
    @IsNumber({}, { message: 'ID категории должен быть числом' })
    readonly category_id: number;

    @ApiProperty({ example: '0', description: 'Процент трат этой категории по умолчанию 0%' })
    @IsNumber({}, { message: 'Процент должен быть числом' })
    readonly percentage: number;
}

export class GetCategoryDto {
    @ApiProperty({ example: '13', description: 'ID категории' })
    @IsNumber({}, { message: 'ID категории должен быть числом' })
    readonly id: number;

    @ApiProperty({ example: 'category', description: 'Название категории' })
    @IsString({ message: 'Название должно быть строкой' })
    @Length(2, 128, { message: 'Категория должна содержать от 2 до 128 символов' })
    readonly name: string;

    @ApiProperty({ example: 'EXPENSE', description: 'Тип категории' })
    @IsEnum(ExpenseType, { message: 'Проверьте тип категории (GOAL/EXPENSE/INCOME)' })
    readonly expense_type: ExpenseType;

    @ApiProperty({ example: 'https://i.pinimg.com/736x/be/61/8b/be618b13e9580a7f49aa1bf8e55371ff.jpg', description: 'Ссылка на изображение' })
    @IsString({ message: 'Ссылка должна быть строкой' })
    @IsUrl({}, { message: 'Ссылка должна быть валидным URL' })
    readonly image_url: string;

    @ApiProperty({ type: [UserCategoryDto], description: 'Список пользователей, связанных с категорией' })
    readonly users: UserCategoryDto[];
}