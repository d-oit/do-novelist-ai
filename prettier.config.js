export default {
  // Core formatting options
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,
  bracketSpacing: true,
  arrowParens: 'avoid',
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
        jsxSingleQuote: true,
        bracketSameLine: false,
      },
    },
    {
      files: '*.{md,mdx}',
      options: {
        parser: 'markdown',
        proseWrap: 'always',
        printWidth: 80,
      },
    },
    {
      files: '*.{json,jsonc}',
      options: {
        parser: 'json',
        trailingComma: 'none',
      },
    },
    {
      files: '*.{css,scss,less}',
      options: {
        parser: 'css',
        singleQuote: false,
      },
    },
    {
      files: '*.{yml,yaml}',
      options: {
        parser: 'yaml',
        singleQuote: false,
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

  // Tailwind CSS specific options
  tailwindConfig: './tailwind.config.js',
  tailwindAttributes: ['class', 'className'],
  tailwindFunctions: ['clsx', 'cva', 'tw'],
};
