// Custom markdownlint configuration with custom rule to forbid H1 headers in docs
const noH1Rule = {
  names: ['no-h1-header'],
  description: 'H1 headers are not allowed in docs',
  tags: ['headings'],
  function: (params, onError) => {
    // Only apply this rule to files in the docs directory
    const filePath = params.name || '';
    if (!filePath.includes('/docs/')) {
      return;
    }
    
    params.tokens.filter(token => token.type === 'heading_open' && token.tag === 'h1').forEach(token => {
      onError({
        lineNumber: token.lineNumber,
        detail: 'H1 headers (#) are not allowed in docs markdown files. Use H2 (##) or lower.',
        context: token.line
      });
    });
  }
};

module.exports = {
  config: require('./.markdownlint.json'),
  customRules: [noH1Rule],
  globs: ['**/*.md'],
  ignores: ['node_modules/**', 'dist/**']
};
