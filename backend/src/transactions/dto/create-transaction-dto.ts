import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNumber, IsString, Length } from "class-validator";

export class CreateTransactionDto {
    @ApiProperty({ example: '1', description: 'ID счета' })
    @IsNumber({}, { message: 'ID счета должен быть числом' })
    readonly budget_id: number;

    @ApiProperty({ example: '1000', description: 'Сумма на счету (BYN)' })
    @IsNumber({}, { message: 'Сумма на счету должна быть числом' })
    readonly amount: number;
    
    @ApiProperty({ example: new Date(), description: 'Дата транзакции' })
    @IsDateString({}, { message: 'Дата начала должна быть датой'})
    readonly date: string;

    @ApiProperty({ example: 'Описание', description: 'Описание транзакции' })
    @IsString({ message: 'Описание должно быть строкой' })
    @Length(0, 128, { message: 'Описание должна содержать менее 128 символов' })
    readonly description: string;
}