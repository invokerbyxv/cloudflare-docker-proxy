# cloudflare-docker-proxy

## 部署

1. click the "Deploy With Workers" button
2. follow the instructions to fork and deploy
3. update routes as you requirement

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/liuweigl/cloudflare-docker-proxy)

## 本地调试

### 环境配置
1. 使用 [SwitchHosts](https://switchhosts.vercel.app/zh) 把域名解析到本地
> 如果 docker 宿主机是 Windows 子系统，ip 需要设置成 192.168.x.x 而不是 127.0.0.1
2. 为域名生成 ssl 证书
> 使用 `mkcert` 生成自定义证书时 docker daemon 好像无法识别 rootCA 所以无法使用，建议从阿里云申请
3. 启动 dev 服务：`npm start`

### vscode 断点
1. 先启动 dev 服务
2. 打开侧边栏上的 `运行和调试` 菜单，运行 `Wrangler`

### HTTP 代理
如果开发主机所在网络也无法访问 docker hub，则需要使用 [Proxifier](https://www.proxifier.com/) 