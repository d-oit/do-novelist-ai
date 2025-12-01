export default {
  // Core formatting options (aligned with AGENTS.md guidelines)
  semi: true,
  singleQuote: true,
  trailingComma: 'all', // Updated to 'all' for better consistency with modern practices
  tabWidth: 2,
  useTabs: false,
  printWidth: 100, // Matches AGENTS.md guideline of ~100 characters
  bracketSpacing: true,
  arrowParens: 'avoid', // Consistent with existing preference
  endOfLine: 'lf',

  // Plugin configuration
  plugins: ['prettier-plugin-tailwindcss'],

  // File-specific overrides
  overrides: [
    {
      files: '*.{ts,tsx,js,jsx}',
      options: {
        parser: 'typescript',
        quoteProps: 'as-needed',
        jsxSingleQuote: true, // Consistent with singleQuote preference
        bracketSameLine: false,
      },
    },
    {
      files: '*.{md,mdx}',
      options: {
        parser: 'markdown',
        proseWrap: 'always',
        printWidth: 80, // Better readability for markdown
      },
    },
    {
      files: '*.{json,jsonc}',
      options: {
        parser: 'json',
        trailingComma: 'none', // JSON doesn't support trailing commas
      },
    },
    {
      files: '*.{css,scss,less}',
      options: {
        parser: 'css',
        singleQuote: false, // CSS uses double quotes by convention
      },
    },
    {
      files: '*.{yml,yaml}',
      options: {
        parser: 'yaml',
        singleQuote: false, // YAML convention
      },
    },
    {
      files: '*.{test,spec}.{ts,tsx,js,jsx}',
      options: {
        // Slightly more relaxed formatting for test files
        printWidth: 120,
      },
    },
  ],

  // Performance optimizations
  requirePragma: false,
  insertPragma: false,
  proseWrap: 'preserve',
  htmlWhitespaceSensitivity: 'css',
  vueIndentScriptAndStyle: false,
  embeddedLanguageFormatting: 'auto',

  // Tailwind CSS specific options (enhanced for better class sorting)
  tailwindConfig: './tailwind.config.js',
  tailwindAttributes: ['class', 'className'],
  tailwindFunctions: ['clsx', 'cva', 'tw', 'cn'], // Added 'cn' for common utility pattern
};
