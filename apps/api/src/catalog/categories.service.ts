import { Injectable } from '@nestjs/common';
import type { CategoryNode } from '@ziarnista/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryTree } from './category-tree';
import { PUBLIC_PRODUCT_WHERE } from './public-product';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** One query: the whole (small) category table */
  async loadTree(): Promise<CategoryTree> {
    const rows = await this.prisma.category.findMany({
      select: { id: true, parentId: true, slug: true, name: true },
    });
    return new CategoryTree(rows);
  }

  /** Two queries in parallel: categories and public product counts per category */
  async getTree(): Promise<CategoryNode[]> {
    const [tree, counts] = await Promise.all([
      this.loadTree(),
      this.prisma.product.groupBy({
        by: ['categoryId'],
        where: PUBLIC_PRODUCT_WHERE,
        _count: { _all: true },
      }),
    ]);
    return tree.toNodes(new Map(counts.map((row) => [row.categoryId, row._count._all])));
  }
}
