// 如果在 Node.js 环境，需要导入库
import { JSONPath } from 'jsonpath-plus';

/**
 * 预处理 arraySortKey 配置，将类似 '$.words[*]' 的路径模式转换成
 * 指向数组本身的路径 '$.words'，便于在递归中直接匹配。
 * @param arraySortKey - 原始的排序配置。
 * @returns 转换后的 Map，键为数组的 JSONPath，值为排序键的 JSONPath。
 */
export function preprocessArraySortKeys(arraySortKey: Record<string, string> | undefined): Map<string, string> {
    const map = new Map<string, string>();
    if (!arraySortKey) {
        return map;
    }
    for (const pathPattern in arraySortKey) {
        // 将末尾的 [*] 或 [] 去掉，得到数组本身的路径
        // 这个正则表达式会匹配路径末尾的 [*] 或 []
        const arrayPath = pathPattern.replace(/\[\*\]$|\[\]$/, '');

        // 确保我们确实是处理一个数组模式
        if (arrayPath !== pathPattern) {
            map.set(arrayPath, arraySortKey[pathPattern]);
        } else {
             // 对于像 '$.arr[*][*]' 这样的复杂路径，我们进行更稳健的处理。
             // 我们找到最后一个 '[*]' 或 '[]' 并切分它。
             const lastIndex = Math.max(pathPattern.lastIndexOf('[*]'), pathPattern.lastIndexOf('[]'));
             if (lastIndex > -1) {
                 const basePath = pathPattern.substring(0, lastIndex);
                 map.set(basePath, arraySortKey[pathPattern]);
             }
        }
    }
    return map;
}

/**
 * 递归排序的核心函数
 * @param currentValue - 当前正在处理的值（对象、数组或原始类型）
 * @param currentPath - 当前值的 JSONPath
 * @param arraySortKeyMap - 预处理后的数组排序规则
 * @returns 排序后的值
 */
function _recursiveSort(currentValue: any, currentPath: string, arraySortKeyMap: Map<string, string>): any {
    // 1. 基准情况：如果不是对象或为 null，直接返回
    if (currentValue === null || typeof currentValue !== 'object') {
        return currentValue;
    }

    // 2. 如果是数组
    if (Array.isArray(currentValue)) {
        // 2.1 首先，递归地对数组中的每一个元素进行排序
        let processedArray = currentValue.map((item, index) => {
            // 计算子元素的路径，例如 $.data.items[0]
            const itemPath = `${currentPath}[${index}]`;
            return _recursiveSort(item, itemPath, arraySortKeyMap);
        });

        // 2.2 检查当前数组是否需要根据 arraySortKey 中的规则排序
        const sortRule = arraySortKeyMap.get(currentPath);

        if (sortRule) {
            // 规则存在，按规则排序 (通常用于对象数组)
            processedArray.sort((a, b) => {
                const keyPath = sortRule;

                // 使用 JSONPath 获取用于排序的实际值
                // wrap: false 确保在未找到时返回 undefined 而不是数组
                const valA = JSONPath({ path: keyPath, json: a, wrap: false });
                const valB = JSONPath({ path: keyPath, json: b, wrap: false });

                // 处理排序键不存在的情况，将它们排在后面
                if (valA === undefined || valA === null) return 1;
                if (valB === undefined || valB === null) return -1;
                
                if (valA < valB) return -1;
                if (valA > valB) return 1;
                return 0;
            });
        } else {
            // 2.3 如果没有特定规则，检查是否为原始类型数组，如果是则进行默认排序
            const isAllPrimitives = processedArray.every(el => typeof el !== 'object' || el === null);
            if (isAllPrimitives) {
                processedArray.sort((a, b) => {
                    if (a === null) return 1; // nulls to the end
                    if (b === null) return -1;
                    if (a < b) return -1;
                    if (a > b) return 1;
                    return 0;
                });
            }
        }
        return processedArray;
    }

    // 3. 如果是对象 (Map)
    const sortedObj: Record<string, any> = {};
    const sortedKeys = Object.keys(currentValue).sort(); // 核心：对对象的键进行字母排序

    for (const key of sortedKeys) {
        // 使用点表示法构建子路径，JSONPath 库会自动处理
        const newPath = `${currentPath}.${key}`;
        // 递归地对其值进行排序
        sortedObj[key] = _recursiveSort(currentValue[key], newPath, arraySortKeyMap);
    }

    return sortedObj;
}

/**
 * diffConfig 接口定义
 */
interface DiffConfig {
    arraySortKey?: Record<string, string>;
}

/**
 * 主函数：递归地对 JSON 对象进行排序
 * @param data - 要排序的原始 JSON 对象。
 * @param diffConfig - 包含排序规则的配置对象。
 * @returns 一个新的、深度排序后的 JSON 对象。
 */
export function sortJsonRecursively(data: any, diffConfig: DiffConfig = {}): any {
    // 为了不修改原始对象，我们先进行一次深拷贝
    const dataCopy = JSON.parse(JSON.stringify(data));
    
    const arraySortKey = diffConfig.arraySortKey || {};
    const arraySortKeyMap = preprocessArraySortKeys(arraySortKey);

    // 从根路径 '$' 开始递归
    return _recursiveSort(dataCopy, '$', arraySortKeyMap);
}
