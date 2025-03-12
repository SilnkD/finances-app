import { Body, Controller, Post, UseGuards, Request, Get, Delete, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category-dto';
import { IdGuard } from 'src/common/guards/auth.guard';
import { AssignCategoryDto } from './dto/assign-category-dto';
import { GetCategoryDto } from './dto/get-category-dto';
import { Role } from 'src/common/enums/roles.enum';

@ApiTags('Категории')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categService: CategoriesService) {}

  @ApiOperation({ summary: 'Создание категории' })
  @ApiResponse({ status: 201, description: 'Категория успешно создана', type: GetCategoryDto })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен'})
  @UseGuards(IdGuard)
  @ApiBearerAuth()
  @Post()
  async createCategory(@Body() createCategoryDto: CreateCategoryDto, @Request() req) {
    const userId = req.user.id;  // Получение userId из JWT токена
    const userRole = req.user.role;
    return this.categService.createCategory(createCategoryDto, userId, userRole==Role.Admin);
  }
  
  @ApiOperation({ summary: 'Присвоение категории пользователю' })
  @ApiResponse({ status: 201, description: 'Категория успешно добавлена', type: GetCategoryDto })
  @ApiResponse({ status: 400, description: 'Некорректные данные или категория уже присвоена пользователю' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @ApiResponse({ status: 404, description: 'Категория не найдена' })
  @UseGuards(IdGuard)
  @ApiBearerAuth()
  @Post('assign')
  async assignCategory(@Body() assignCategoryDto: AssignCategoryDto, @Request() req) {
    const userId = req.user.id;
    return this.categService.assignCategory(assignCategoryDto.category_id, userId, assignCategoryDto.percentage);
  }
  
  @ApiOperation({ summary: 'Получение категорий' })
  @ApiResponse({ status: 200, description: 'Категории успешно получены', type: [GetCategoryDto] })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен'})
  @UseGuards(IdGuard)
  @ApiBearerAuth()
  @Get()
  async getCategories(@Request() req) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.categService.findAllCategoriesByUser(userId, userRole==Role.Admin);
  }
  
  @ApiOperation({ summary: 'Удаление категории' })
  @ApiResponse({ status: 200, description: 'Категория успешно удалена' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 403, description: 'Вы не можете удалить чужую категорию' })
  @ApiResponse({ status: 404, description: 'Категория не найдена' })
  @UseGuards(IdGuard)
  @ApiBearerAuth()
  @Delete('/delete/:id')
  async deleteCategories(@Request() req, @Param('id') category_id: string) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.categService.deleteCategory(userId, userRole==Role.Admin, Number(category_id));
  }

  
  @ApiOperation({ summary: 'Обновление категории' })
  @ApiResponse({ status: 200, description: 'Категория успешно обновлена', type: GetCategoryDto })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 403, description: 'Вы не можете изменить чужую категорию' })
  @ApiResponse({ status: 404, description: 'Категория не найдена' })
  @UseGuards(IdGuard)
  @ApiBearerAuth()
  @Put('/:id')
  async updateCategory(@Body() updateCategoryDto: CreateCategoryDto, @Request() req, @Param('id') category_id: string) {
    const userId = req.user.id;
    const userRole = req.user.role;
      return this.categService.updateCategory(Number(category_id), updateCategoryDto, userId, userRole);
  }
}