# Hope Bridge Donation Site

寄付を受けるための静的ウェブサイトテンプレートです。支援内容、寄付金額、透明性、FAQを1ページにまとめ、外部決済サービスへ遷移する導線を用意しています。

## 使い方

1. `index.html` の団体名、文言、メールアドレス、実績数値を実際の内容に変更します。
2. `script.js` の `DONATION_LINKS` を、Stripe Payment Links、PayPal、Syncableなどの実際の決済URLに差し替えます。
3. 必要に応じて、特定商取引法に基づく表記、プライバシーポリシー、寄付控除に関する案内ページを追加します。
4. 静的ホスティング（GitHub Pages、Netlify、Vercelなど）に公開します。

## ローカル確認

```bash
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` を開いて確認します。

## ファイル構成

- `index.html`: サイトの構造とコンテンツ
- `styles.css`: レスポンシブデザインと見た目
- `script.js`: モバイルメニュー、寄付金額選択、決済URLへの遷移
