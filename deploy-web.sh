#!/bin/bash

# ==========================================
# 묘록(Myorok) 웹 서버(Next.js) 배포 스크립트 (rsync 방식)
# ==========================================

# 1. 접속할 서버 정보 설정
SERVER="ksh@192.168.0.6"
PORT="22"

# 외부 네트워크에서 배포할 경우
# SERVER="ksh@125.190.25.48"
# PORT="2222"

# 2. 로컬 및 서버 프로젝트 경로 설정
LOCAL_WEB_DIR="$(pwd)/apps/web/"
SERVER_PROJECT_DIR="/home/ksh/myorok"
SERVER_WEB_DIR="$SERVER_PROJECT_DIR/apps/web"

# 3. PM2 프로세스 이름
PM2_APP_NAME="myorok"

echo "🚀 배포를 시작합니다... (접속: $SERVER:$PORT)"

echo "1️⃣ 로컬 웹 프로젝트(apps/web)를 서버로 동기화(rsync)합니다..."
# 제외할 폴더들: node_modules, .next, .git 등
rsync -avz -e "ssh -p $PORT" \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  "$LOCAL_WEB_DIR" "$SERVER:$SERVER_WEB_DIR/"

if [ $? -ne 0 ]; then
  echo "❌ rsync 동기화 실패"
  exit 1
fi

echo "2️⃣ 서버에 접속하여 빌드 및 배포를 진행합니다..."
ssh -p $PORT $SERVER << EOF
  export NVM_DIR="\$HOME/.nvm"
  [ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
  nvm use 20 || nvm install 20

  cd $SERVER_WEB_DIR || { echo "❌ 서버 프로젝트 경로를 찾을 수 없습니다."; exit 1; }

  echo "3️⃣ 웹 의존성을 설치합니다..."
  npm install

  echo "4️⃣ Next.js 앱을 빌드합니다..."
  npm run build

  echo "5️⃣ PM2로 서버를 재시작합니다..."
  pm2 restart $PM2_APP_NAME || pm2 start npm --name "$PM2_APP_NAME" -- run start -p 3001

  echo "✅ 웹 서버 배포가 완료되었습니다!"
EOF

echo "🎉 모든 배포 과정이 성공적으로 끝났습니다."
