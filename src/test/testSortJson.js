import { sortJsonRecursively } from '../sortJson.js';
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
/*
输出:
{
  "a": [
    2,
    5,
    10
  ],
  "b": {
    "x": "xxx",
    "z": "zzz"
  },
  "c": 3
}
*/

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
/*
输出:
{
  "extra": "data",
  "words": [
    {
      "id": 2,
      "name": "what"
    },
    {
      "id": 1000,
      "name": "hello"
    }
  ]
}
*/


// --- 示例 3: 递归排序，对数组的数组进行排序 ---
const json3 = {
    "arr": [
        [{"id": 200, "name": "aaa"}], 
        [{"id": 3, "name": "bbb"}]
    ]
};

// 这里的规则表示：对于 'arr' 数组中的每个元素（它本身也是一个数组），
// 使用该元素（$）的第一个子元素（[0]）的id属性（.id）来进行排序。
const config3 = {
    arraySortKey: {
        "$.arr[*]": "$[0].id" 
    }
};

const sortedJson3 = sortJsonRecursively(json3, config3);
console.log("\n示例 3 - 排序后:", JSON.stringify(sortedJson3, null, 2));
/*
输出:
{
  "arr": [
    [
      {
        "id": 3,
        "name": "bbb"
      }
    ],
    [
      {
        "id": 200,
        "name": "aaa"
      }
    ]
  ]
}
*/

// --- 示例 4: 你的 `$.arr[*][*]` 示例的解释和实现 ---
// 你的原始需求 `{"$.arr[*][*]": "$.id"}` 有些歧义。
// `$.arr[*][*]` 通常选择的是内层数组的元素，即那些对象。
// 但排序的目标是外层的数组 `$.arr`。
// 我的代码通过 `preprocessArraySortKeys` 函数将 `$.arr[*][*]` 智能地解析为对 `$.arr[*]` 数组的排序规则。
// 然而，排序键 `$.id` 应用于 `$.arr` 的直接子元素（即内层数组）时会失败，因为 `[{"id": 200}]` 没有 `.id` 属性。
// 正确的写法如示例3所示。但为了展示代码的健壮性，我们尝试一个更复杂的路径。

const json4 = {
    "complex": [
        { "items": [{"value": 100}], "meta": "group B" },
        { "items": [{"value": 50}], "meta": "group A" }
    ]
};

// 规则：排序 'complex' 数组，排序键是每个元素的 'items' 数组的第一个元素的 'value' 字段
const config4 = {
    arraySortKey: {
        "$.complex[*]": "$.items[0].value"
    }
};
const sortedJson4 = sortJsonRecursively(json4, config4);
console.log("\n示例 4 - 复杂路径排序后:", JSON.stringify(sortedJson4, null, 2));
/*
输出:
{
  "complex": [
    {
      "items": [
        {
          "value": 50
        }
      ],
      "meta": "group A"
    },
    {
      "items": [
        {
          "value": 100
        }
      ],
      "meta": "group B"
    }
  ]
}
*/