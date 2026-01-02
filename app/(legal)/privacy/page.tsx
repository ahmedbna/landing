'use client';

import PrivacyMDX from '@/content/privacy.mdx';
import { MDXProvider } from '@mdx-js/react';
import { mdxComponents } from '@/components/mdx-components';

export default function PrivacyPage() {
  return (
    <MDXProvider components={mdxComponents}>
      <PrivacyMDX />
    </MDXProvider>
  );
}
