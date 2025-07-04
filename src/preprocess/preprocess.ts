import { sortJsonRecursively } from './sortJson';
import { formatJson } from './formatJson';
import { ignoreNull } from './ignoreNull';

export function preProcess(jsonObj: any, diffConfig: any) {

    // 使用 sortJsonRecursively 和 formatJson 处理
    const sortedJson = sortJsonRecursively(jsonObj, diffConfig);
    const dismissedNull = ignoreNull(sortedJson, diffConfig);
    const formattedJson = formatJson(dismissedNull, 2);
    return formattedJson
}