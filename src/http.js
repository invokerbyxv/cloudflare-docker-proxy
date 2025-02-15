/**
 * 拷贝响应对象
 * @param {Response} response 
 */
export function copyResponse(response) {
    const [reader1, reader2] = response.body.tee()
    return [new Response(reader1, response), new Response(reader2, response)]
}