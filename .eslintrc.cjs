module.exports = {
  parserOptions: {
    // Use current directory to search for tsconfig.json
    tsconfigRootDir: __dirname,
  },

  settings: {
    // Allow using tsconfig.json configs when resolving imports
    "import/resolver": {
      typescript: {
        project: "./tsconfig.json"
      }
    }
  },
};
