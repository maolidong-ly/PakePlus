# 用 GitHub Actions 打 Windows 包（不依赖 PakePlus Token）

## 1. 把本目录推到你的 GitHub 仓库

在终端（需已安装 [GitHub CLI](https://cli.github.com/) 并 `gh auth login`）：

```bash
cd /path/to/xidian-paike-win
git init -b main
git add -A
git commit -m "Add schedule app and Windows build workflow"
gh repo create xidian-paike --private --source=. --remote=origin --push
```

仓库名可自定；也可用 GitHub 网页新建空仓库后 `git remote add origin ...` 再 `git push -u origin main`。

## 2. 在 GitHub 上触发打包

1. 打开仓库 → **Actions**
2. 左侧选 **Build Windows EXE**
3. **Run workflow** → `app_name` 保持 `xidian-paike` 或改成英文名 → Run
4. 约 15–40 分钟（首次较慢）
5. 完成后点该次运行 → **Artifacts** 下载 `xidian-paike-windows`（含 `.msi`、`.exe`，若生成则含 `WebView2Loader.dll`）

## 3. 发给用户

- 客户端需安装 **WebView2 运行库**（你已有 `WebView2-运行库-Windows.zip` 时可一并发放）
- `keep-binary` 生成的 `.exe` 需与 `WebView2Loader.dll` 放在同一文件夹

## 说明

- 打包在 **GitHub 提供的 Windows 虚拟机**上执行，与 Mac/Windows 本机无关
- 每月 GitHub 免费 Actions 额度约 2000 分钟（私有仓库也计入）
- 业务数据预装：打包前替换根目录 `bundled_app_data.json`（见 `PAKEPLUS-README.txt`）
