// metro.config.js
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {withNativeWind} = require('nativewind/metro');

const defaultConfig = getDefaultConfig(__dirname);

const customConfig = mergeConfig(defaultConfig, {
  resolver: {
    // force Metro to prefer the CommonJS ("main") build over the ESM ("module") build
    mainFields: ['react-native', 'main'],
  },
  // …any other tweaks you had in here…
});

module.exports = withNativeWind(customConfig, {
  input: './global.css', // your existing NativeWind input
});
