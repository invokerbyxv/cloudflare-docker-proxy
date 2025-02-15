import { decodeBase64, encodeBase64 } from "./base64"
import { copyResponse } from "./http"
import { logBlockEnd, logBlockStart, logHttp, } from "./logger"

addEventListener("fetch", (event) => {
  event.passThroughOnException()
  event.respondWith(handleRequest(event.request))
})

const TOP_DOMAIN = "eastcoal.tech"

const DOCKER_HUB = "https://registry-1.docker.io"

const routes = {
  ["docker." + TOP_DOMAIN]: DOCKER_HUB,
  ["quay." + TOP_DOMAIN]: "https://quay.io",
  ["gcr." + TOP_DOMAIN]: "https://gcr.io",
  ["k8s-gcr." + TOP_DOMAIN]: "https://k8s.gcr.io",
  ["k8s." + TOP_DOMAIN]: "https://registry.k8s.io",
  ["ghcr." + TOP_DOMAIN]: "https://ghcr.io",
  ["cloudsmith." + TOP_DOMAIN]: "https://docker.cloudsmith.io",
}

async function handleRequest(request) {

  const handler = await RequestHandler.create(request)
  return handler.route()
}

// 末尾的 / 不能省略，否则 getForwardRealm 会出错
const AUTHORIZE_PATH = "/auth/"

class RequestHandler {
  /**
   * @type {string}
   */
  upstream

  /**
   * @type {URL}
   */
  url

  /**
   * @type {string}
   */
  method

  /**
   * @type {Headers}
   */
  headers

  /**
   * @type {ArrayBuffer}
   */
  body

  constructor() {
  }

  /**
   * @param {Request} request
   */
  static async create(request) {
    const handler = new RequestHandler()
    logBlockStart('RequestHandler block')
    handler.upstream = resolveUpstream(request)
    handler.url = resolveUrl(request, handler.upstream === DOCKER_HUB)
    handler.headers = resolveRequestHeaders(request, handler)
    handler.body = await resolveRequestBody(request)
    handler.method = request.method
    logHttp('收到请求', request)
    logBlockEnd()
    return handler
  }

  route() {
    if (isAuthRequest(this.url)) {
      return this.forwardAuthRequest()
    }
    // 代理原始请求
    return this.forwardGenericalRequest()
  }

  async forwardGenericalRequest() {
    logBlockStart('forwardGenericalRequest')
    const forwardUrl = new URL(this.upstream + this.url.pathname + this.url.search + this.url.hash)
    const forwardReq = new Request(forwardUrl, {
      method: this.method,
      headers: this.headers,
      body: this.body,
      redirect: "follow",
    })
    let forwardRes = await fetch(forwardReq)
    // 让客户端根据 Www-Authenticate 头部重新请求
    if (forwardRes.status === 401) {
      const wwwAuthenticate = parseAuthenticate(forwardRes.headers.get("Www-Authenticate"))
      if (wwwAuthenticate) {
        const realmUrl = new URL(this.url)
        setForwardRealm(realmUrl, wwwAuthenticate.realm)
        const realmRes = new Response(forwardRes.body, forwardRes)
        realmRes.headers.delete('content-length')
        realmRes.headers.set(
          "Www-Authenticate", `Bearer realm="${realmUrl.toString()}",service="${wwwAuthenticate.service}"`
        )
        forwardRes = realmRes
      }
    }
    const [forwardRes1, forwardRes2] = copyResponse(forwardRes)
    await logHttp('执行常规请求', forwardReq, forwardRes1)
    logBlockEnd()
    return forwardRes2
  }

  async forwardAuthRequest() {
    logBlockStart('forwardAuthRequest')
    const forwardRealm = getForwardRealm(this.url)
    const forwardUrl = new URL(forwardRealm)
    forwardUrl.search = this.url.search
    const forwardReq = new Request(forwardUrl,
      {
        method: this.method,
        headers: this.headers,
        body: this.body
      })
    const forwardRes = await fetch(forwardReq)
    const [forwardRes1, forwardRes2] = copyResponse(forwardRes)
    await logHttp('执行授权请求', forwardReq, forwardRes1)
    logBlockEnd()
    return forwardRes2
  }
}

/**
 * 解析上游请求地址
 * 
 * @param {Request} request 
 */
function resolveUpstream(request) {
  const requestUrl = new URL(request.url)
  const upstream = routes[requestUrl.hostname]
  if (!upstream) {
    throw new Error(`未找到 ${requestUrl.hostname} 对应的 upstream 配置项`)
  }
  return upstream
}

/**
 * 处理默认的 library 命名空间
 * Example: /v2/busybox/manifests/latest => /v2/library/busybox/manifests/latest
 * 
 * @param {Request} request 
 * @param {boolean} isDockerHub
 * @returns {URL} 
 */
function resolveUrl(request, isDockerHub) {
  const transformedUrl = new URL(request.url)
  if (isDockerHub) {
    const pathParts = transformedUrl.pathname.split("/")
    if (pathParts.length == 5) {
      pathParts.splice(2, 0, "library")
      transformedUrl.pathname = pathParts.join("/")
    }
  }
  return transformedUrl
}

/**
 * 解析 request headers 值
 * @param {Request} request 
 * @param {RequestHandler} handler
 */
function resolveRequestHeaders(request, handler) {
  const url = new URL(handler.upstream)
  const headers = new Headers(request.headers)
  headers.set('Host', url.hostname)
  return headers
}

/**
 * 解析 request body 值
 * @param {Request} request 
 */
async function resolveRequestBody(request) {
  const method = request.method.toUpperCase()
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    return await request.arrayBuffer()
  }
  return null
}

function parseAuthenticate(authenticateStr) {
  // sample: Bearer realm="https://auth.ipv6.docker.com/token",service="registry.docker.io"
  // match strings after =" and before "
  const re = /(?<=\=")(?:\\.|[^"\\])*(?=")/g
  const matches = authenticateStr.match(re)
  if (matches == null || matches.length < 2) {
    throw new Error(`invalid Www-Authenticate Header: ${authenticateStr}`)
  }
  return {
    realm: matches[0],
    service: matches[1],
  }
}

function isAuthRequest(url) {
  return url.pathname.startsWith(AUTHORIZE_PATH)
}

function setForwardRealm(url, realm) {
  const base64Realm = encodeBase64(realm)
  url.pathname = `${AUTHORIZE_PATH}${base64Realm}`
}

function getForwardRealm(url) {
  const base64Realm = url.pathname.split(AUTHORIZE_PATH).pop()
  return decodeBase64(base64Realm)
}

