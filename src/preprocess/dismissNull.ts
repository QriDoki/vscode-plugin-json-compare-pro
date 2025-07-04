export function dismissNull(jsonObj: any, diffConfig: any): any {
    if (!diffConfig.dismissNull) {
        return jsonObj
    }
    if (Array.isArray(jsonObj)) {
        return jsonObj.map(item => dismissNull(item, diffConfig)).filter(item => item !== null && item !== undefined);
    } else if (typeof jsonObj === 'object' && jsonObj !== null) {
        return Object.fromEntries(
            Object.entries(jsonObj)
                .map(([key, value]) => [key, dismissNull(value, diffConfig)])
                .filter(([key, value]) => value !== null && value !== undefined)
        );
    }
    return jsonObj;
}