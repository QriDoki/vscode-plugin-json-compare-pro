import { sortJsonRecursively } from './sortJson';
import { formatJson } from './formatJson';
import { dismissNull } from './dismissNull';

export function preProcess(jsonObj: any, diffConfig: any) {

    // 使用 sortJsonRecursively 和 formatJson 处理
    const sortedJson = sortJsonRecursively(jsonObj, diffConfig);
    const dismissedNull = dismissNull(sortedJson, diffConfig);
    const formattedJson = formatJson(dismissedNull, 2);
    return formattedJson
}