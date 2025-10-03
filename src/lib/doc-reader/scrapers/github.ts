import type { ScrapedContent } from './html';

export async function fetchGitHubRelease(url: string): Promise<ScrapedContent> {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub URL');
  }

  const [, owner, repo] = match;

  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };

  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();

    const markdown = `# ${data.name || data.tag_name}

**Version:** ${data.tag_name}
**Published:** ${new Date(data.published_at).toLocaleDateString()}
**Author:** ${data.author.login}

## Release Notes

${data.body || 'No release notes provided.'}

## Assets

${data.assets.map((asset: any) => `- [${asset.name}](${asset.browser_download_url}) (${(asset.size / 1024 / 1024).toFixed(2)} MB)`).join('\n')}
`;

    return {
      title: `${owner}/${repo} - ${data.tag_name}`,
      content: `${data.name || data.tag_name}\n\n${data.body || ''}`,
      markdown,
      url,
      contentType: 'application/json',
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch GitHub release: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function fetchGitHubReadme(owner: string, repo: string): Promise<ScrapedContent> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3.raw',
  };

  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const markdown = await response.text();

    return {
      title: `${owner}/${repo} README`,
      content: markdown,
      markdown,
      url: `https://github.com/${owner}/${repo}`,
      contentType: 'text/markdown',
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch GitHub README: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
