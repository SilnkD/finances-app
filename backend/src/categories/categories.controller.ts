import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category-dto';
import { Category } from './categories.model';
import { IdGuard } from 'src/auth/auth.guard';

@ApiTags('Категории')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categService: CategoriesService) {}

  @ApiOperation({ summary: 'Создание категории' })
  @ApiResponse({ status: 200, type: Category })
  @UseGuards(IdGuard)
  @ApiBearerAuth()
  @Post()
  async createCategory(@Body() createCategoryDto: CreateCategoryDto, @Request() req) {
    const userId = req.user.id;  // Получение userId из JWT токена
    return this.categService.createCategory(createCategoryDto, userId);
  }
}