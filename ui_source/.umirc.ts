import { defineConfig } from 'umi';
import  { GenerateSW } from 'workbox-webpack-plugin';

const manifestName = 'manifest.webmanifest';
export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [
    { path: '/', component: '@/pages/index' },
  ],
  fastRefresh: {},
  outputPath: '../ui',
  //pwd 相关配置
  copy: ['/pwa'],
  links: [{ rel: 'manifest', href: `/${manifestName}` }, { rel: "shortcut icon", href:"favicon.ico"}], // 手动插入 .webmanifest 文件的 link
  chainWebpack(memo, { env, webpack, createCSSRule }) {
      // workbox 配置
      memo.plugin('workbox').use(GenerateSW, [
        {
          swDest: 'sw.js',
          exclude: [/\.map$/, /favicon\.ico$/, /^manifest.*\.js?$/],
          skipWaiting: true,
          clientsClaim: true,
        },
      ]);
  },
});
