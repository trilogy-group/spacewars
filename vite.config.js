export default {
  root: './',
  base: '/spacewars/',
  publicDir: 'public',
  server: {
    host: true,
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  },
  resolve: {
    dedupe: ['three']
  }
} 