import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../app/**/*.mdx', '../app/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(config) {
    // Filter out nitro / tanstack-start plugins that interfere with Storybook output.
    // tanstackStart()/nitro() return nested plugin arrays, and their sub-plugins
    // (e.g. @tanstack/router-plugin code-splitter/generator) depend on each other,
    // so remove each whole contribution rather than individual plugin objects.
    if (config.plugins) {
      config.plugins = (config.plugins as any[]).filter((entry) => {
        const descriptors = ([] as any[])
          .concat(entry)
          .flat(Infinity)
          .filter((p) => p && typeof p === 'object' && 'name' in p)
          .map((p) => String(p.name).toLowerCase());
        const isNitroOrTanstack =
          descriptors.includes('nitro') ||
          descriptors.some(
            (name) =>
              name.includes('tanstack') ||
              name.includes('nitro') ||
              name.includes('start-manifest') ||
              name.includes('router-generator') ||
              name.includes('router-code-splitter') ||
              name.includes('routes-manifest') ||
              name.includes('prerender-routes')
          );
        return !isNitroOrTanstack;
      });
    }
    return config;
  },
};
export default config;