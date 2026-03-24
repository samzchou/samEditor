module.exports = {
  apps : [{
    name   : "knowledge-server",
    script : "npm",
	args: "run start",
	cwd: "./src/app",
	autorestart: true,
    watch: false,
    env: {
      NODE_ENV: "development",
    },
  }]
}
