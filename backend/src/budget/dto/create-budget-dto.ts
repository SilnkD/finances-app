import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class CreateBudgetDto {
    @ApiProperty({ example: '1000', description: 'Сумма на счету (BYN)' })
    @IsNumber({}, { message: 'Сумма на счету должна быть числом' })
    readonly amount: number;

    @ApiProperty({ example: '1', description: 'ID категории' })
    @IsNumber({}, { message: 'ID категории должен быть числом' })
    readonly category_id: number;
}