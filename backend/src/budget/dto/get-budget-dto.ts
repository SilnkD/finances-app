import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class GetBudgetDto {
    @ApiProperty({ example: '1', description: 'ID цели' })
    @IsNumber({}, { message: 'ID цели должен быть числовым значением' })
    readonly id: number;

    @ApiProperty({ example: 'Путешествие', description: 'Название категории' })
    @IsString({ message: 'Название категории должно быть строкой' })
    readonly category_name: String;
    
    @ApiProperty({ example: '1000', description: 'Сумма на счету (BYN)' })
    @IsNumber({}, { message: 'Сумма на счету должна быть числом' })
    readonly amount: number;
}