module.exports = {
  apps : [{
    name: 'carpooling_docker',
    script: '/var/app/src/index.js',
    instances: 1,
    autorestart: false,
    watch: false,
  }, {
    name: 'carpooling_dev',
    script: './src/index.js',
    instances: 1,
    autorestart: true,
    watch: true,
  }]
};
