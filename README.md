# Transcendence

![game](./img/game.gif)

## 프로젝트 설명

`Transcendence`는 42서울 공통과정의 마지막 과제인 `ft_transcendence` 프로젝트입니다. 이 프로젝트는 웹 기반의 멀티플레이어 게임을 개발하는 것을 목표로 합니다. 사용자는 실시간으로 다른 플레이어와 게임을 즐길 수 있으며, 친구 목록 관리, 프로필 수정, 2단계 인증 등의 기능을 제공합니다.

## 주요 기능

- **실시간 멀티플레이어 게임**: 웹 소켓을 이용한 실시간 게임 플레이
- **친구 목록 관리**: 친구 추가, 삭제 및 검색 기능
- **프로필 수정**: 사용자 프로필 이미지 및 닉네임 수정
- **2단계 인증**: 보안 강화를 위한 2단계 인증 기능
- **토너먼트 모드**: 토너먼트 형식의 게임 모드 제공

## 기술 스택

- **프론트엔드**: JavaScript, CSS
- **백엔드**: Django REST framework, WebSocket
- **데이터베이스**: PostgreSQL
- **인프라**: Docker, Nginx (리버스 프록시)

## 아키텍처

```plaintext
nginx:443
  ├── backend(django):8000
  │   └── db(postgres):5432
  └── frontend:5173
```

## 설치 및 실행

1. **리포지토리 클론**

```sh
git clone https://github.com/MomHelpMe/Transcendence.git
cd Transcendence
```

2. **환경 변수 설정**

```sh
cp .env.example .env.local
```

`.env.local` 파일을 열어 환경 변수를 설정합니다.

3. **실행**

```sh
./scripts/run_frontend

# 다른 터미널에서 실행
./scripts/run_backend
```

## API 문서

API 엔드포인트와 사용 방법은 [Swagger 문서](http://localhost:8000/swagger/)에서 확인할 수 있습니다.
