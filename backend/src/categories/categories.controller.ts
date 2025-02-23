import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category-dto';
import { Category } from './categories.model';

@ApiTags('Категории')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categService: CategoriesService) {}

  @ApiOperation({ summary: 'Создание категории' })
  @ApiResponse({ status: 200, type: Category })
  @ApiBearerAuth()
  @Post()
  async createCategory(@Body() createCategoryDto: CreateCategoryDto, @Request() req) {
    const userId = req.user.id;  // Получение userId из JWT токена
    return this.categService.createCategory(createCategoryDto, userId);
  }
}