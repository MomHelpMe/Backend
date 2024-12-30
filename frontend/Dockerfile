FROM node:22.5-alpine3.19

# 2. 작업 디렉토리를 생성하고 설정합니다.
WORKDIR /app

# 3. package.json 및 package-lock.json을 복사합니다.
COPY package*.json ./

# 4. 의존성을 설치합니다.
RUN npm install && \
    apk update && \
    apk add --no-cache curl

# 5. 나머지 애플리케이션 소스를 복사합니다.
COPY . .

# 6. Vite 서버를 실행합니다.
CMD ["sh", "-c", "npm run build && cp -r img dist/img && npm run preview"]

# 7. 컨테이너가 노출할 포트를 설정합니다.
EXPOSE 5173
