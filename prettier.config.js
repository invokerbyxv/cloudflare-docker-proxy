/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 *
 * @description 不要配置 `parser` 属性，否则只能格式化特定类型的文件
 */
const config = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: true,
  bracketSpacing: true,
  requirePragma: false,
  insertPragma: false,
  quoteProps: 'as-needed',
  arrowParens: 'avoid',
  trailingComma: 'none',
  proseWrap: 'preserve',
  htmlWhitespaceSensitivity: 'ignore',
  endOfLine: 'auto'
}

export default config
