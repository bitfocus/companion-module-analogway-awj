module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint', 'prettier'],
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
	ignorePatterns: ['.eslintrc.js', 'dist', 'src/proto/*.*'],
	"rules": {
		"@typescript-eslint/no-explicit-any": "off",
		"no-unused-vars": ["warn", { "destructuredArrayIgnorePattern": "^_", "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
  }
}
