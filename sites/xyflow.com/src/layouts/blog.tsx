import { ContentGrid, ContentGridItem } from '@xyflow/xy-ui';
import { BaseLayout, BlogPostPreview, Hero } from 'xy-shared';

import { getMdxPagesUnderRoute } from 'xy-shared';

export default function Blog() {
  return (
    <BaseLayout>
      <Hero
        title="Blog"
        subtitle="News and updates from the team behind React Flow and Svelte Flow."
        align="center"
      />
      <div className="-mx-6 sm:mx-auto">
        <ContentGrid>
          {getMdxPagesUnderRoute('/blog').map((page) => (
            <ContentGridItem key={page.route} route={page.route}>
              <BlogPostPreview
                title={page.frontMatter?.title}
                intro={page.frontMatter?.intro}
                date={page.frontMatter?.date}
                authors={page.frontMatter?.authors}
                headingSize="md"
              />
            </ContentGridItem>
          ))}
        </ContentGrid>
      </div>
    </BaseLayout>
  );
}
