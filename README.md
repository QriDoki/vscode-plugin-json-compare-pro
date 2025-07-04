<p align="center">
  <img src="https://raw.githubusercontent.com/QriDoki/vscode-plugin-json-compare-pro/main/.github/images/logo.png" alt="logo"></img>
</p>

**JSON Compare Pro** 是一个强大的 JSON 文件比较工具，可以帮助您更高效地比较和分析 JSON 文件。

## 功能特点
这个扩展提供以下核心功能：

- 比较两个 JSON 文件的差异
- 根据配置文件进行批量比较
- 支持自定义排序规则进行 JSON 文件比较

## 使用
### 选中json文件对比
在资源管理器中选中两个json文件(按住ctrl或者command可以多选文件), 右键, 点击`JSON Compare This Two`, 之后会出现一个弹窗, 让您输入一份`diffConfig`, 可以选择不输入. `diffConfig`的详细介绍见下文  

### 使用`json-compare-config.json`进行批量对比
右键`json-compare-config.json`文件, 会出现一个`Compare based on this config`选项, 点击 会根据其中的配置 找寻文件夹下的需要对比的文件  

在[本项目的`test-files`目录](https://github.com/QriDoki/vscode-plugin-json-compare-pro/tree/main/test-files)下, 有使用示例  
```json
{
    "leftFilesPattern": "left-(\\d+)/zuo-(\\d+).json",
    "rightFilesPattern": "right-$1/you-$2.json",
    "diffConfig": {
        "arraySortKey": {
            "$.scores[*]": "$.subject"
        },
        "ignoreNull": true
    }
}
```
#### `leftFilesPattern`
寻找需要对比的json的左边, 通过正则匹配`json-compare-config.json`相同文件夹下的文件  
(路径不要带`./`)  

#### `rightFilesPattern`
对匹配到的结果, 通过`rightFilesPattern`的模板进行正则替换, 将匹配的文件进行对比  
(路径不要带`./`)  

#### `diffConfig`
见下文`diffConfig`  

## `diffConfig`
```json
{
    "arraySortKey": {
        "$.scores[*]": "$.subject"
    },
    "ignoreNull": true
}
```

### `arraySortKey`
key和value都是jsonPath  
对于key中的path的json数组, 使用以其为根的 value的jsonPath指定的字段作为排序key, 为这个json数组排序  

### `ignoreNull`
不展示值为null的字段  

**🎉祝您使用愉快🎉**
