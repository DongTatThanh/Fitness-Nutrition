import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost, BlogCategory } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly blogPostRepository: Repository<BlogPost>,

    @InjectRepository(BlogCategory)
    private readonly blogCategoryRepository: Repository<BlogCategory>,
  ) {}

  // =======================
  //  BLOG POST FUNCTIONS
  // =======================

  /**
   * Lấy danh sách bài viết (có phân trang)
   */
  async findAllPosts(page: number = 1, limit: number = 10) {
    const [posts, total] = await this.blogPostRepository.findAndCount({
      relations: ['category'], // load category đi kèm
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: posts,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * Lấy bài viết theo ID
   */
  async findPostById(id: number) {
    const post = await this.blogPostRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    await this.incrementViews(id);
    return post;
  }

  /**
   * Lấy bài viết theo slug
   */
  async findPostBySlug(slug: string) {
    const post = await this.blogPostRepository.findOne({
      where: { slug },
      relations: ['category'],
    });

    if (!post) {
      throw new NotFoundException(`Post with slug "${slug}" not found`);
    }

    await this.incrementViews(post.id);
    return post;
  }

  /**
   * Lấy bài viết theo ID dành cho admin (không tăng view)
   */
  async findPostByIdAdmin(id: number) {
    const post = await this.blogPostRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  /**
   * Lấy danh sách bài viết nổi bật (is_featured = 1)
   */
  async findFeaturedPosts(limit: number = 5) {
    return await this.blogPostRepository.find({
      where: { is_featured: 1 },
      relations: ['category'],
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Danh sách bài viết cho admin (có filter)
   */
  async findAllPostsAdmin(options?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: number;
    isFeatured?: number;
  }) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      isFeatured,
    } = options || {};

    const query = this.blogPostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
      .orderBy('post.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      query.andWhere('(post.title LIKE :search OR post.slug LIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (categoryId) {
      query.andWhere('post.category_id = :categoryId', { categoryId });
    }

    if (isFeatured !== undefined) {
      query.andWhere('post.is_featured = :isFeatured', { isFeatured });
    }

    const [posts, total] = await query.getManyAndCount();

    return {
      data: posts,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * Lấy bài viết theo categoryId
   */
  async findPostsByCategory(categoryId: number, page: number = 1, limit: number = 10) {
    const [posts, total] = await this.blogPostRepository.findAndCount({
      where: { category_id: categoryId },
      relations: ['category'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: posts,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * Tạo mới bài viết
   */
  async createPost(createPostDto: CreatePostDto) {
    const post = this.blogPostRepository.create(createPostDto);
    return await this.blogPostRepository.save(post);
  }

  /**
   * Cập nhật bài viết
   */
  async updatePost(id: number, updatePostDto: UpdatePostDto) {
    const post = await this.blogPostRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    Object.assign(post, updatePostDto);
    return await this.blogPostRepository.save(post);
  }

  /**
   * Xóa bài viết
   */
  async deletePost(id: number) {
    const post = await this.blogPostRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    await this.blogPostRepository.remove(post);
    return { message: 'Post deleted successfully' };
  }

  /**
   * Tăng lượt xem bài viết
   */
  private async incrementViews(id: number) {
    await this.blogPostRepository.increment({ id }, 'views', 1);
  }

  // =======================
  // CATEGORY FUNCTIONS
  // =======================

  /**
   * Lấy tất cả danh mục (có sort_order)
   */
  async findAllCategories() {
    return await this.blogCategoryRepository.find({
      order: { sort_order: 'ASC' },
    });
  }

  /**
   * Lấy danh mục cho admin (có search)
   */
  async findAllCategoriesAdmin(options?: { search?: string }) {
    const query = this.blogCategoryRepository
      .createQueryBuilder('category')
      .orderBy('category.sort_order', 'ASC');

    if (options?.search) {
      query.where('category.name LIKE :search OR category.slug LIKE :search', {
        search: `%${options.search}%`,
      });
    }

    return query.getMany();
  }

  /**
   * Lấy category theo ID
   */
  async findCategoryById(id: number) {
    const category = await this.blogCategoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  /**
   * Lấy category theo slug
   */
  async findCategoryBySlug(slug: string) {
    const category = await this.blogCategoryRepository.findOne({
      where: { slug },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    return category;
  }

  /**
   * Tạo danh mục mới
   */
  async createCategory(createCategoryDto: CreateCategoryDto) {
    const category = this.blogCategoryRepository.create(createCategoryDto);
    return await this.blogCategoryRepository.save(category);
  }

  /**
   * Cập nhật danh mục
   */
  async updateCategory(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.blogCategoryRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    Object.assign(category, updateCategoryDto);
    return await this.blogCategoryRepository.save(category);
  }

  /**
   * Xóa danh mục
   */
  async deleteCategory(id: number) {
    const category = await this.findCategoryById(id);
    await this.blogCategoryRepository.remove(category);
    return { message: 'Category deleted successfully' };
  }
}
