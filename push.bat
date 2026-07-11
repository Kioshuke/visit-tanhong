@echo off
git add .
git commit -m "update du lich tan hong"
git push origin main --force
echo ---- DEPLOY LEN GITHUB VA CLOUDFLARE THANH CONG! ----
pause