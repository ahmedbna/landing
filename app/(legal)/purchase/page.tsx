import { MDXRemote } from 'next-mdx-remote/rsc';
import fs from 'fs';
import path from 'path';
import { mdxComponents } from '@/components/mdx-components';

export const metadata = {
  title: 'Restore Purchases',
};

export default async function PurchasePage() {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'content/purchase.mdx'),
    'utf8',
  );

  return <MDXRemote source={source} components={mdxComponents} />;
}
