import { ValidationPipeCustom } from './validation.pipe';
import { ArgumentMetadata, HttpException, HttpStatus } from '@nestjs/common';
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

  it('should skip validation for non-DTO types', async () => {
    const value = { someField: 'Test' };
    const metadata: ArgumentMetadata = { type: 'body', metatype: String }; // Используем примитивный тип

    const result = await pipe.transform(value, metadata);
    expect(result).toEqual(value); // Должен вернуть значение без валидации
  });

  it('should throw an error with detailed validation messages', async () => {
    const value = { name: '' }; // Пустое значение, которое не проходит валидацию
    const metadata: ArgumentMetadata = { type: 'body', metatype: TestDto };

    try {
      await pipe.transform(value, metadata);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.getResponse()).toEqual({
        message: ['name - name should not be empty'],
      });
    }
  });
});