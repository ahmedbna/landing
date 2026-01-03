import { MDXRemote } from 'next-mdx-remote/rsc';
import fs from 'fs';
import path from 'path';
import { mdxComponents } from '@/components/mdx-components';

export const metadata = {
  title: 'Terms of Service',
};

export default async function TermsPage() {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'content/terms.mdx'),
    'utf8'
  );

  return <MDXRemote source={source} components={mdxComponents} />;
}
