// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite no navegador roda num Web Worker com WebAssembly (wa-sqlite).
// 1) Metro precisa reconhecer .wasm como asset, senão o bundle web quebra com
//    "Unable to resolve ./wa-sqlite/wa-sqlite.wasm".
config.resolver.assetExts.push('wasm');

// 2) O worker usa SharedArrayBuffer, que exige um contexto "cross-origin
//    isolated" — ou seja, os headers COOP/COEP em todas as respostas do dev server.
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    return middleware(req, res, next);
  };
};

module.exports = config;
