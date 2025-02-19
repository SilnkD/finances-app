import { ArgumentMetadata, HttpException, HttpStatus, Injectable, PipeTransform } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

//для обработки некорректных dto
@Injectable()
export class ValidationPipe implements PipeTransform <any> {
    async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
        let type;
        if (metadata.metatype) type = metadata.metatype;
        const obj = plainToInstance(type, value);
        const errors = validate(obj);

        if ((await errors).length) {
            let messages = (await errors).map(err=>{
                return `${err.property} - ${err.constraints ? Object.values(err.constraints).join(', ') : 'No constraints'}`;
            })
            throw new HttpException({message: `${messages}`}, HttpStatus.BAD_REQUEST);
        }
    }
}