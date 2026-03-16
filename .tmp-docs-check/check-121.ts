// 将 var 替换为 const（预览模式）
ast_grep_replace('var $NAME = $VALUE', 'const $NAME = $VALUE', 'JavaScript')

// 确认后实际执行
ast_grep_replace('var $NAME = $VALUE', 'const $NAME = $VALUE', 'JavaScript', 'src/', false)
