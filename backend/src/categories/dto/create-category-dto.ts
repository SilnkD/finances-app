import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString, IsUrl, Length, IsNumberString } from "class-validator";
import { ExpenseType } from "src/common/enums/expense-type.enum";

export class CreateCategoryDto {
    @ApiProperty({ example: 'category name example', description: 'Название категории' })
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

    @ApiProperty({ example: '0', description: 'Процент трат этой категории по умолчанию 0%' })
    @IsNumberString({}, { message: 'Процент должен быть числом' })
    readonly default_percentage: number;

    @ApiProperty({ example: '1', description: 'Создатель категории' })
    @IsNumberString({}, { message: 'Идентификатор пользователя должен быть числом' })
    readonly user_id: number;
}