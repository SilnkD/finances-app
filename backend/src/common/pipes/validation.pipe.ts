import { ArgumentMetadata, HttpException, HttpStatus, Injectable, PipeTransform } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

// для обработки некорректных dto
@Injectable()
export class ValidationPipeCustom implements PipeTransform<any> {
    async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
        if (!metadata.metatype || !this.toValidate(metadata.metatype)) {
            return value;
        }

        const obj = plainToInstance(metadata.metatype, value);
        const errors = await validate(obj);

        if (errors.length > 0) {
            const messages = errors.map(err => {
                return `${err.property} - ${err.constraints ? Object.values(err.constraints).join(', ') : 'No constraints'}`;
            });
            throw new HttpException({ message: messages }, HttpStatus.BAD_REQUEST);
        }

        return value;
    }

    private toValidate(metatype: Function): boolean {
        const types: Function[] = [String, Boolean, Number, Array, Object];
        return !types.includes(metatype);
    }
}