const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Get the project root (apps/mobile)
const projectRoot = __dirname;
// Get the workspace root (monorepo root)
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Ensure Metro resolves from the correct project root
config.projectRoot = projectRoot;

// Watch folders for monorepo support
config.watchFolders = [workspaceRoot];

// Ensure node_modules are resolved correctly
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Platform-specific extensions are handled automatically by Metro
// Do NOT override sourceExts - let Metro handle .web.* vs .native.* based on platform

// Modules that should be blocked/mocked on web
const NATIVE_ONLY_MODULES = [
  'expo-sqlite',
  '@react-native-community/netinfo',
  'expo-background-fetch',
  'expo-task-manager',
];

// Exclude native-only modules on web platform
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && NATIVE_ONLY_MODULES.includes(moduleName)) {
    console.log(`[Metro] Blocking ${moduleName} on web`);
    return {
      type: 'empty',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
