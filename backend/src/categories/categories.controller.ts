import { Body, Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category-dto';
import { Category } from '../database/models/categories.model';
import { IdGuard } from 'src/common/guards/auth.guard';

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
    const userRole = req.user.role;
    return this.categService.createCategory(createCategoryDto, userId, userRole=="ADMIN");
  }
  
  @ApiOperation({ summary: 'Получение категорий' })
  @ApiResponse({ status: 200, type: [Category] })
  @UseGuards(IdGuard)
  @ApiBearerAuth()
  @Get()
  async getCategories(@Request() req) {
    const userId = req.user.id;  // Получение userId из JWT токена
    const userRole = req.user.role;
    return this.categService.findAllCategoriesByUser(userId, userRole=="ADMIN");
  }
}