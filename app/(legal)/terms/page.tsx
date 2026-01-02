'use client';

import TermsMDX from '@/content/terms.mdx';
import { MDXProvider } from '@mdx-js/react';
import { mdxComponents } from '@/components/mdx-components';

export default function TermsPage() {
  return (
    <MDXProvider components={mdxComponents}>
      <TermsMDX />
    </MDXProvider>
  );
}
