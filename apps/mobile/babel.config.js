module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "react-native-reanimated/plugin",
    ],
    // Transform node_modules that use import.meta
    overrides: [
      {
        include: /node_modules\/zustand/,
        plugins: ["babel-plugin-transform-import-meta"],
      },
    ],
  };
};
