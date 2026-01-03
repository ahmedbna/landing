import { MDXRemote } from 'next-mdx-remote/rsc';
import fs from 'fs';
import path from 'path';
import { mdxComponents } from '@/components/mdx-components';

export const metadata = {
  title: 'Privacy Policy',
};

export default async function PrivacyPage() {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'content/privacy.mdx'),
    'utf8'
  );

  return <MDXRemote source={source} components={mdxComponents} />;
}
