/**
 * 将 JavaScript 对象序列化为带有结尾逗号的 JSON 字符串。
 * 这种格式不是标准的 JSON，但被很多开发工具支持。
 *
 * @param obj 需要序列化的对象
 * @param space 用于美化输出的空格数或字符串，默认为 4
 * @returns 带有结尾逗号的 JSON 字符串
 */
export function formatJson(obj: any, space: number | string = 4): string {
  // 1. 先生成一个标准的美化版 JSON 字符串
  // 必须使用 space 参数，否则正则表达式无法工作
  const baseJson = JSON.stringify(obj, null, space);

  // 2. 使用正则表达式添加结尾逗号
  // 正则表达式解析:
  // (?<=[^,{])   - 正向后行断言：确保前面的字符不是逗号或左花括号（避免在已有逗号的行和空对象的第一行添加逗号）
  // \n           - 匹配一个换行符
  // (?=\s*[}\]]) - 正向前行断言：确保换行符后面跟着的是可选的空白字符和右花括号/右方括号
  // g            - 全局匹配
  const regex = /(?<=[^,{[\s])\n(?=\s*[}\]])/g;
  
  // 将匹配到的换行符替换为 ",(换行符)"
  const result = baseJson.replace(regex, ',\n');

  return result;
}
