import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class KnowledgeBaseService {
  constructor(private readonly prisma: PrismaService) {}

  async getArticles(params: {
    category?: string;
    search?: string;
    isPublic?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = params;

    const where: any = {
      isPublished: true,
    };

    if (params.category) where.category = params.category;
    if (params.isPublic !== undefined) where.isPublic = params.isPublic;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { content: { contains: params.search, mode: 'insensitive' } },
        { tags: { hasSome: [params.search.toLowerCase()] } },
      ];
    }

    const [articles, total] = await Promise.all([
      this.prisma.knowledgeBaseArticle.findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          category: true,
          tags: true,
          views: true,
          publishedAt: true,
        },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.knowledgeBaseArticle.count({ where }),
    ]);

    return {
      data: articles,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getArticleBySlug(slug: string, incrementViews = true) {
    const article = await this.prisma.knowledgeBaseArticle.findUnique({
      where: { slug },
    });

    if (!article || !article.isPublished) {
      throw new NotFoundException('Article not found');
    }

    if (incrementViews) {
      await this.prisma.knowledgeBaseArticle.update({
        where: { slug },
        data: { views: { increment: 1 } },
      });
    }

    // Get related articles
    const relatedArticles = article.relatedArticles.length > 0
      ? await this.prisma.knowledgeBaseArticle.findMany({
          where: {
            id: { in: article.relatedArticles },
            isPublished: true,
          },
          select: {
            slug: true,
            title: true,
            excerpt: true,
          },
        })
      : [];

    return { ...article, relatedArticles };
  }

  async getCategories() {
    const categories = await this.prisma.knowledgeBaseArticle.groupBy({
      by: ['category'],
      where: { isPublished: true },
      _count: { category: true },
    });

    return categories.map((c) => ({
      name: c.category,
      count: c._count.category,
    }));
  }

  async recordFeedback(slug: string, helpful: boolean) {
    await this.prisma.knowledgeBaseArticle.update({
      where: { slug },
      data: helpful
        ? { helpfulYes: { increment: 1 } }
        : { helpfulNo: { increment: 1 } },
    });
  }

  async getPopularArticles(limit = 5) {
    return this.prisma.knowledgeBaseArticle.findMany({
      where: { isPublished: true, isPublic: true },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        views: true,
      },
      orderBy: { views: 'desc' },
      take: limit,
    });
  }
}
