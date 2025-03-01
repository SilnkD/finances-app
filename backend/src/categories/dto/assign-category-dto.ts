import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class AssignCategoryDto {
    @ApiProperty({ example: '1', description: 'ID категории' })
    @IsNumber({}, { message: 'Процент должен быть числом' })
    readonly category_id: number;

    @ApiProperty({ example: '0', description: 'Процент трат этой категории по умолчанию 0%' })
    @IsNumber({}, { message: 'Процент должен быть числом' })
    readonly percentage: number;
}