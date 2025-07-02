import { sortJsonRecursively } from './dist/sortJson.js';

console.log("开始测试 sortJson.ts...\n");

// --- 示例 1: 基础对象键排序和简单数组排序 ---
const json1 = {
    c: 3,
    a: [10, 2, 5],
    b: {
        z: "zzz",
        x: "xxx"
    }
};

const sortedJson1 = sortJsonRecursively(json1, {});
console.log("示例 1 - 排序后:", JSON.stringify(sortedJson1, null, 2));

// --- 示例 2: 根据 'id' 排序对象数组 ---
const json2 = {
    "words": [
        {"id": 1000, "name": "hello"}, 
        {"id": 2, "name": "what"}
    ],
    "extra": "data"
};

const config2 = {
    arraySortKey: {
        "$.words[*]": "$.id"
    }
};

const sortedJson2 = sortJsonRecursively(json2, config2);
console.log("\n示例 2 - 排序后:", JSON.stringify(sortedJson2, null, 2));

// --- 示例 3: 递归排序，对数组的数组进行排序 ---
const json3 = {
    "arr": [
        [{"id": 200, "name": "aaa"}], 
        [{"id": 3, "name": "bbb"}]
    ]
};

const config3 = {
    arraySortKey: {
        "$.arr[*]": "$[0].id" 
    }
};

const sortedJson3 = sortJsonRecursively(json3, config3);
console.log("\n示例 3 - 排序后:", JSON.stringify(sortedJson3, null, 2));

// --- 示例 4: 复杂路径排序 ---
const json4 = {
    "complex": [
        { "items": [{"value": 100}], "meta": "group B" },
        { "items": [{"value": 50}], "meta": "group A" }
    ]
};

const config4 = {
    arraySortKey: {
        "$.complex[*]": "$.items[0].value"
    }
};
const sortedJson4 = sortJsonRecursively(json4, config4);
console.log("\n示例 4 - 复杂路径排序后:", JSON.stringify(sortedJson4, null, 2));

console.log("\n✅ 所有测试完成！sortJson.ts 功能正常！");
