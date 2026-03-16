// 查找所有 console.log 调用
ast_grep_search('console.log($$$ARGS)', 'TypeScript', 'src/')

// 查找所有 async 函数
ast_grep_search('async function $NAME($$$PARAMS) { $$$BODY }', 'TypeScript')
