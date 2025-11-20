import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('posts') // prefix cho tất cả route
export class PostController {
  constructor(private readonly postService: PostService) {}

  // ==========================
  // 📌 BLOG POSTS API
  // ==========================

  /**
   * Lấy danh sách bài viết (có phân trang)
   * GET /posts?page=1&limit=10
   */
  @Get()
  async getAllPosts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.postService.findAllPosts(page, limit);
  }

  /**
   * Lấy bài viết nổi bật
   * GET /posts/featured
   */
  @Get('featured')
  async getFeaturedPosts() {
    return this.postService.findFeaturedPosts();
  }

  /**
   * Danh sách bài viết cho admin (có filter)
   * GET /posts/admin
   */
  @Get('admin')
  async getAdminPosts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isFeatured') isFeatured?: string,
  ) {
    const parsedCategoryId =
      categoryId !== undefined ? Number(categoryId) : undefined;
    const parsedIsFeatured =
      isFeatured !== undefined ? Number(isFeatured) : undefined;

    return this.postService.findAllPostsAdmin({
      page,
      limit,
      search,
      categoryId: Number.isNaN(parsedCategoryId) ? undefined : parsedCategoryId,
      isFeatured: Number.isNaN(parsedIsFeatured) ? undefined : parsedIsFeatured,
    });
  }

  /**
   * Lấy bài viết theo ID (admin)
   * GET /posts/admin/:id
   */
  @Get('admin/:id')
  async getAdminPostById(@Param('id', ParseIntPipe) id: number) {
    return this.postService.findPostByIdAdmin(id);
  }

  /**
   * Tạo bài viết (admin)
   */
  @Post('admin')
  async createPost(@Body() createPostDto: CreatePostDto) {
    return this.postService.createPost(createPostDto);
  }

  /**
   * Cập nhật bài viết (admin)
   */
  @Put('admin/:id')
  async updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postService.updatePost(id, updatePostDto);
  }

  /**
   * Xóa bài viết (admin)
   */
  @Delete('admin/:id')
  async deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postService.deletePost(id);
  }

  /**
   * Lấy bài viết theo ID
   * GET /posts/id/5
   */
  @Get('id/:id')
  async getPostById(@Param('id', ParseIntPipe) id: number) {
    return this.postService.findPostById(id);
  }

  /**
   * Lấy bài viết theo slug
   * GET /posts/slug/{slug}
   */
  @Get('slug/:slug')
  async getPostBySlug(@Param('slug') slug: string) {
    return this.postService.findPostBySlug(slug);
  }

  /**
   * Lấy bài viết theo categoryId
   * GET /posts/category/3?page=1&limit=10
   */
  @Get('category/:id')
  async getPostsByCategory(
    @Param('id', ParseIntPipe) id: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.postService.findPostsByCategory(id, page, limit);
  }

  // ==========================
  // 📌 BLOG CATEGORY API
  // ==========================

  /**
   * Lấy tất cả danh mục blog
   * GET /posts/blog/categories
   */
  @Get('blog/categories')
  async getAllCategories() {
    return this.postService.findAllCategories();
  }

  /**
   * Danh sách danh mục cho admin
   * GET /posts/admin/categories
   */
  @Get('admin/categories')
  async getAdminCategories(@Query('search') search?: string) {
    return this.postService.findAllCategoriesAdmin({ search });
  }

  /**
   * Tạo danh mục (admin)
   */
  @Post('admin/categories')
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.postService.createCategory(createCategoryDto);
  }

  /**
   * Cập nhật danh mục (admin)
   */
  @Put('admin/categories/:id')
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.postService.updateCategory(id, updateCategoryDto);
  }

  /**
   * Xóa danh mục (admin)
   */
  @Delete('admin/categories/:id')
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.postService.deleteCategory(id);
  }

  /**
   * Lấy danh mục theo slug
   * GET /posts/blog/categories/{slug}
   */
  @Get('blog/categories/slug/:slug')
  async getCategoryBySlug(@Param('slug') slug: string) {
    return this.postService.findCategoryBySlug(slug);
  }

  /**
   * Lấy danh mục theo ID
   * GET /posts/blog/categories/id/3
   */
  @Get('blog/categories/id/:id')
  async getCategoryById(@Param('id', ParseIntPipe) id: number) {
    return this.postService.findCategoryById(id);
  }
  
}
