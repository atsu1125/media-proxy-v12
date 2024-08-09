# Media Proxy for Misskey

[→ メディアプロキシの仕様](./SPECIFICATION.md)

Misskey v12の/proxyが単体で動作します（Misskey v12 Latestのコードがほぼそのまま移植されています）。
Misskey v13のFastifyベースのメディアプロキシコードをv12のKoaベースのコードで書き直してます。

## サーバーセットアップ（Dockerの場合）
```
git clone https://github.com/atsu1125/media-proxy-v12.git
cd media-proxy-v12
cp compose-example.yml compose.yml
cp .config/{example,default}.yml
docker compose up -d
```

## サーバーのセットアップ方法（Systemdの場合）
まずはgit cloneしてcdしてください。

```
git clone https://github.com/atsu1125/media-proxy-v12.git
cd media-proxy-v12
```

### yarn install
```
NODE_ENV=production yarn install
```

### configを編集
```
cp .config/{example,default}.yml
```
で設定ファイルをコピーして`.config/default.yml`を編集してください

### サーバーを立てる
適当にサーバーを公開してください。  
（ここではmediaproxy.example.comで公開するものとします。）

systemdサービスのファイルを作成…

/etc/systemd/system/misskey-proxy.service

エディタで開き、以下のコードを貼り付けて保存（ユーザーやポートは適宜変更すること）:

```systemd
[Unit]
Description=Misskey Media Proxy

[Service]
Type=simple
User=misskey
ExecStart=/usr/bin/npm start
WorkingDirectory=/home/misskey/media-proxy-v12
Environment="NODE_ENV=production"
TimeoutSec=60
StandardOutput=journal
StandardError=journal
SyslogIdentifier=media-proxy
Restart=always

[Install]
WantedBy=multi-user.target
```

```
sudo systemctl daemon-reload
sudo systemctl enable misskey-proxy
sudo systemctl start misskey-proxy
```

3000ポートまでnginxなどでルーティングしてやります。

### Misskeyのdefault.ymlに追記

mediaProxyの指定をMisskeyのdefault.ymlに追記し、Misskeyを再起動してください。

```yml
mediaProxy: https://mediaproxy.example.com
```
