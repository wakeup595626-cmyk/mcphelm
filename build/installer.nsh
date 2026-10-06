# MCPHelm —— 自定义 NSIS 脚本（由 electron-builder.yml 的 nsis.include 引入）
#
# 为什么需要它
# ------------
# 默认数据根是 <安装目录>\data（见 desktop/main.cjs：设计目标是「C 盘零占用 + 数据跟着安装盘走」，
# docs/faq.md 也向用户承诺「卸载只删程序本身，配置和日志保留在数据目录里」）。
# 但 electron-builder 模板自带的删除逻辑是 RMDir /r $INSTDIR，而它并非只在手动卸载时执行：
# 安装向导在覆盖安装 / 自动更新时会先静默调用旧版卸载器（模板 installSection.nsh 的
# uninstallOldVersion），于是整个安装目录连同 data（配置、日志、运行时、导出）一起被删。
# 这不是理论风险：0.1.1 覆盖安装到 D:\Apps\MCPHelm 时真的丢过一次 data。
#
# 修法
# ----
# 覆盖模板的 customRemoveFiles 宏：模板（templates/nsis/uninstaller.nsh）一旦检测到这个宏存在，
# 就不再执行 RMDir /r $INSTDIR，改由这里逐项删除。只删安装文件（根目录下的 Electron 运行时
# 文件 + resources\ + locales\ 等），保留 data\（数据根）与 mcphelm.data.json（数据位置指针，
# 用户可能把数据根指到别的盘）。卸载后 $INSTDIR 仍会存在，这是有意为之。
#
# 两条红线（改这个文件时务必守住）：
# 1) 绝不整目录删除：不写 RMDir /r $INSTDIR，也不写 RMDir /r "$INSTDIR\data"。
# 2) 绝不用 *.* 这类通配删除根目录全部文件：它会连 mcphelm.data.json.keep 一起删掉，
#    保护随即失效；也不要用 *.json 通配，那会误删数据位置指针 mcphelm.data.json。只显式列后缀。
#
# 结果：升级安装、自动更新、手动卸载都不会再碰用户数据；想彻底清干净，卸载后手动删掉 data\ 即可。

!macro customRemoveFiles
  SetOutPath $TEMP

  # Electron 运行时：安装目录根下的文件（显式后缀清单）
  Delete "$INSTDIR\*.dll"
  Delete "$INSTDIR\*.exe"
  Delete "$INSTDIR\*.pak"
  Delete "$INSTDIR\*.bin"
  Delete "$INSTDIR\*.dat"
  Delete "$INSTDIR\*.txt"
  Delete "$INSTDIR\*.html"
  Delete "$INSTDIR\vk_swiftshader_icd.json"

  # 安装包自带的子目录
  RMDir /r "$INSTDIR\resources"
  RMDir /r "$INSTDIR\locales"
  RMDir /r "$INSTDIR\swiftshader"

  # 明确保留：data\（数据根）、mcphelm.data.json（数据位置指针）、以及任何未知文件 / 目录。
!macroend
