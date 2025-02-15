
/**
 * @param {string} identifier
 */
export function logBlockStart(identifier) {
    console.group(`==================== ${identifier} ====================`)
}


export function logBlockEnd() {
    console.groupEnd()
}

/**
 * 请求日志
 * @param {string} identifier
 * @param {Request} request 
 * @param {Response} response 
 */
export async function logHttp(identifier,request, response) {
    console.log(`==================== ${identifier} ====================`)
    printRequest(request)
    if (response) {
        await printResponse(response)
    }
}

/**
 * 打印请求日志
 * @param {Request} request 
 */
function printRequest(request) {
    console.group('Request 详情')
    console.log('URL', request.url)
    console.log('Method', request.method)
    printHeaders('Headers', request.headers)
    if (typeof request.body === 'string') {
        console.log('Body:', request.body);
    } else if (request.body) {
        // 如果 body 是一个 stream 或者其他格式，这里可能需要额外处理
        console.log('Body:', '[Object]');
    }
    console.groupEnd()
}

/**
 * 打印响应日志
 * @param {Response} response 
 */
async function printResponse(response) {
    console.group('Response 详情')
    console.log('Status', response.status)
    console.log('Status Text', response.statusText)
    printHeaders('Headers', response.headers)
    console.log('Body:', await response.text())
    console.groupEnd()
}

/**
 * 打印 Headers
 * 
 * @param {string} key 
 * @param {Headers} headers 
 */
function printHeaders(key, headers) {
    console.group(key)
    headers.forEach((value, key) => {
        console.log(`${key}: ${value}`)
    })
    console.groupEnd()
}