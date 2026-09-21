const path = require('path');

const enableModernSassApi = (rules = []) => {
  rules.forEach((rule) => {
    if (Array.isArray(rule.oneOf)) {
      enableModernSassApi(rule.oneOf);
    }

    if (!Array.isArray(rule.use)) {
      return;
    }

    rule.use.forEach((loader) => {
      if (
        typeof loader === 'object' &&
        loader.loader?.includes('sass-loader')
      ) {
        loader.options = {
          ...loader.options,
          api: 'modern',
        };
      }
    });
  });
};

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      enableModernSassApi(webpackConfig.module.rules);
      return webpackConfig;
    },
  },
};
