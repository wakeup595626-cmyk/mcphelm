import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

// 数据保留约定的回归测试。
// 背景：electron-builder 的 NSIS 模板默认执行 RMDir /r $INSTDIR，而升级安装 / 自动更新时
// 安装向导会先静默调用旧版卸载器，于是 <安装目录>\data（配置、日志、运行时、导出）被整目录
// 删除 —— 0.1.1 覆盖安装到 D:\Apps\MCPHelm 时真实发生过。
// 约定：build/installer.nsh 覆盖 customRemoveFiles 宏，只逐项删程序文件，
// 永不触碰 data\ 与数据位置指针 mcphelm.data.json。

const root = join(import.meta.dirname, '..');
const builderYml = readFileSync(join(root, 'electron-builder.yml'), 'utf8');
const installerNsh = readFileSync(join(root, 'build', 'installer.nsh'), 'utf8');

/** 去掉注释行，只留会参与编译的指令（注释里会提到要避免的写法，不能误判）。 */
function codeOnly(nsh: string): string {
  return nsh
    .split(/\r?\n/)
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');
}

test('electron-builder.yml：NSIS 引入自定义脚本，且不删应用数据', () => {
  assert.match(builderYml, /^nsis:\s*$/m);
  assert.match(builderYml, /^\s+include:\s*installer\.nsh\s*$/m);
  assert.match(builderYml, /deleteAppDataOnUninstall:\s*false/);
});

test('installer.nsh：覆盖 customRemoveFiles 宏', () => {
  assert.match(installerNsh, /!macro customRemoveFiles/);
  assert.match(installerNsh, /!macroend/);
});

test('installer.nsh：绝不整目录删除 $INSTDIR 或 data', () => {
  const code = codeOnly(installerNsh);
  assert.doesNotMatch(code, /RMDir\s+\/r\s+\$INSTDIR(\s|$)/im, '不得整目录删除 $INSTDIR');
  assert.doesNotMatch(code, /RMDir\s+\/r\s+"\$INSTDIR(\s|")/im, '不得整目录删除 "$INSTDIR"');
  assert.doesNotMatch(code, /\$INSTDIR\\data/i, '不得引用 $INSTDIR\\data');
});

test('installer.nsh：不使用会误伤数据指针的通配删除', () => {
  const code = codeOnly(installerNsh);
  assert.doesNotMatch(code, /\*\.\*/i, '不得使用 *.* 通配删除');
  assert.doesNotMatch(code, /\*\.json/i, '不得使用 *.json 通配删除');
});

test('installer.nsh：程序文件删除范围显式列举', () => {
  const code = codeOnly(installerNsh);
  const required = [
    /Delete\s+"\$INSTDIR\\\*\.dll"/,
    /Delete\s+"\$INSTDIR\\\*\.exe"/,
    /Delete\s+"\$INSTDIR\\\*\.pak"/,
    /Delete\s+"\$INSTDIR\\\*\.bin"/,
    /Delete\s+"\$INSTDIR\\\*\.dat"/,
    /RMDir\s+\/r\s+"\$INSTDIR\\resources"/,
    /RMDir\s+\/r\s+"\$INSTDIR\\locales"/,
  ];
  for (const pattern of required) {
    assert.match(code, pattern);
  }
});

