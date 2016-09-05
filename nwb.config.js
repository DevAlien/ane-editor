module.exports = {
  type: 'react-component',
  build: {
    externals: {
      'react': 'React'
    },
    global: 'ANEEditor',
    jsNext: true,
    umd: true
  },
  babel: {
    stage: 0
  },
  webpack: {
    html: {
      template: 'demo/src/index.html'
    }
  }
}
