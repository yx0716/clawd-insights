# macOS 签名与公证（消除 Gatekeeper 弹窗）

未签名的 dmg 在用户机器上会触发「Apple 无法验证 … 是否包含恶意软件」弹窗，且新版 macOS 不再提供"仍要打开"按钮，对下载转化是硬伤。消除它的唯一途径是 **Developer ID 签名 + Apple 公证**。CI 已经铺好：**把下面 5 个 Secrets 配上，下一次推 tag 就自动出签名+公证的 dmg**；不配则维持现状（未签名构建，不报错）。

## 一次性准备（约 1 小时 + $99/年）

1. **注册 Apple Developer Program**：https://developer.apple.com/programs/enroll/（个人开发者即可，$99/年）。
2. **创建 Developer ID Application 证书**：
   - 本机 Xcode → Settings → Accounts → Manage Certificates → ➕ → *Developer ID Application*；
   - 或在 https://developer.apple.com/account/resources/certificates 手动创建（需先用钥匙串生成 CSR）。
3. **导出 .p12**：钥匙串访问 → 我的证书 → 右键该证书 → 导出，设一个导出密码；然后 `base64 -i cert.p12 | pbcopy` 得到 base64 串。
4. **生成 App 专用密码**（公证用）：https://account.apple.com → 登录与安全 → App 专用密码。
5. **拿到 Team ID**：https://developer.apple.com/account → Membership details。

## 配置 GitHub Secrets（repo → Settings → Secrets and variables → Actions）

| Secret | 内容 |
|---|---|
| `MAC_CSC_LINK` | .p12 的 base64 串 |
| `MAC_CSC_KEY_PASSWORD` | .p12 导出密码 |
| `APPLE_ID` | Apple ID 邮箱 |
| `APPLE_APP_SPECIFIC_PASSWORD` | App 专用密码（xxxx-xxxx-xxxx-xxxx） |
| `APPLE_TEAM_ID` | 10 位 Team ID |

**五个必须一起配**：只配公证不配证书，公证会因 app 未签名而失败；只配一部分 Apple 凭据，electron-builder 会直接报错提示补全（fail-loud，防止悄悄发出未公证的包）。

## 验证

推一个 tag 后看 build-mac 日志：出现 `notarization successful` 即成功。本地复验：

```bash
spctl -a -t open --context context:primary-signature -v "Clawd Insights.app"   # accepted
xcrun stapler validate "dist/Clawd-Insights-<ver>-arm64.dmg"                    # worked
```

用户侧效果：双击即开，无任何弹窗。

## 相关但另说的事

- **Windows SmartScreen**：同类问题，需要 OV/EV 代码签名证书（约 $100–400/年）或 Azure Trusted Signing；且新证书前几周仍会触发 SmartScreen（信誉累积期）。等 mac 这套跑顺再议。
- **技术细节**：`package.json` mac 段的 `hardenedRuntime` / `entitlements`（Electron JIT 所需）/ `notarize: true` 已配好；公证工具走 `notarytool`，一般 5 分钟内出结果。
