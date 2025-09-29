## Create a dedicated user

Although `terrad` does not require a superuser account to run, you will need elevated privileges during installation. Create a dedicated system user and run `terrad` under that account for better isolation.

## Increase the maximum files _terrad_ can open

`terrad` opens many concurrent file descriptors by default. Increase the `nofile` limit in `/etc/security/limits.conf`:

```bash
# Example additions to /etc/security/limits.conf
*                soft    nofile          65535
*                hard    nofile          65535
```

Log out and back in to apply the new limits.

## Run the server as a daemon

`terrad` should run continuously. Configure a `systemd` service to start it on boot.

### Register `terrad` as a service

Create `/etc/systemd/system/terrad.service`:

```ini
[Unit]
Description=Terra Daemon
After=network.target

[Service]
Type=simple
User=<TERRA_USER>
ExecStart=<PATH_TO_TERRAD>/terrad start
Restart=on-abort
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

Update `<TERRA_USER>` and `<PATH_TO_TERRAD>` for your environment, then reload and enable the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable terrad
sudo systemctl start terrad
```

### Control the service

```bash
# Check health
sudo systemctl status terrad

# Restart sequences
sudo systemctl stop terrad
sudo systemctl start terrad
sudo systemctl restart terrad
```

### Access logs

Use `journalctl -t terrad` to review logs. Append `-r` to reverse chronological order or `-f` to tail continuously.
