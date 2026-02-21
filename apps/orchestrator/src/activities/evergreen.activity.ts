import { Injectable } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { PostsService } from '@gitroom/nestjs-libraries/database/prisma/posts/posts.service';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

@Injectable()
@Activity()
export class EvergreenActivity {
  constructor(
    private _postsService: PostsService,
    private _organization: PrismaRepository<'organization'>
  ) {}

  @ActivityMethod()
  async getAllOrganizationIds(): Promise<string[]> {
    const orgs = await this._organization.model.organization.findMany({
      select: { id: true },
    });
    return orgs.map((org) => org.id);
  }

  @ActivityMethod()
  async processEvergreenForOrganization(orgId: string): Promise<void> {
    await this._postsService.processEvergreenForOrganization(orgId);
  }
}
