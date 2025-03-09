import { ValidationPipeCustom } from './validation.pipe';
import { ArgumentMetadata, BadRequestException, HttpException } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';

class TestDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

describe('ValidationPipeCustom', () => {
  let pipe: ValidationPipeCustom;

  beforeEach(() => {
    pipe = new ValidationPipeCustom();
  });

  it('should pass valid data', async () => {
    const value = { name: 'Valid Name' };
    const metadata: ArgumentMetadata = { type: 'body', metatype: TestDto };

    const result = await pipe.transform(value, metadata);
    expect(result).toEqual(value);
  });

  it('should throw an error for invalid data', async () => {
    const value = { invalidField: 'Test' }; // Данные не соответствуют DTO
    const metadata: ArgumentMetadata = { type: 'body', metatype: TestDto };

    await expect(pipe.transform(value, metadata)).rejects.toThrow(HttpException);
  });
});