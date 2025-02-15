// 将字符串编码为 Base64
export function encodeBase64(str) {
    // 创建一个 TextEncoder 来将字符串转换为 Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
  
    // 使用 btoa 对 Uint8Array 进行 Base64 编码
    let binary = '';
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
  }
  
  // 将 Base64 字符串解码回原始字符串
  export function decodeBase64(base64Str) {
    // 使用 atob 解码 Base64 字符串
    const binary = atob(base64Str);
  
    // 创建一个 Uint8Array 来存储二进制数据
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
  
    // 使用 TextDecoder 将 Uint8Array 转换回字符串
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }