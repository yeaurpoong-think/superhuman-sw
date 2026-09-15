---
id: arcads-workflow-infinite-ad-generation
title: Arcads Workflow — 무한 광고 소재 생성 (Claude MCP 연동)
rank: Zy
category: automation
tags: [ai-trend, automation, ugc]
sources:
  - url: 'https://www.instagram.com/reel/DdHDY9Cp2T8/'
    type: reel
post_url: null
researched_at: '2026-09-15T11:58:06.692Z'
executed_at: null
published_at: null
---

## 🎯 핵심 요약

상품 이미지 하나만 업로드하면, Claude(Fable 5)가 직접 광고 제작 워크플로우를 설계하고 그 위에서 UGC 스타일 영상·정적 이미지 광고·인쇄물 스타일 광고까지 형식만 다른 광고 소재를 끝없이 뽑아내는 것을 보여주는 콘텐츠다. 핵심 도구는 Arcads(AI 광고 제작 SaaS)의 신규 기능 Workflow — 노드 기반 무한 캔버스 위에 여러 AI 모델(Seedance, GPT Image, Nano Banana 등)을 자유롭게 연결해 하나의 파이프라인으로 만드는 기능이다. 영상에서는 이 워크플로우를 Claude와 MCP(Model Context Protocol)로 직접 연결해 대화만으로 노드를 설계·실행시키는 장면이 나온다.

## 💡 핵심 인사이트

- "한 상품 → 전 포맷 광고"가 핵심 워크플로우다 — 실제 데모에서 단백질 쉐이크 제품과 뇌기능 보충제 두 상품으로, 세로형 숏폼 UGC 영상, 애니메이션 카툰 광고, 잡지·신문 스타일 인쇄 광고까지 같은 제품 이미지 하나에서 파생시켰다.
- AI 모델 선택 자체가 워크플로우의 일부다 — 화면에 Claude의 모델 선택 UI가 그대로 노출되며, 실제로는 "Effort: Low" 설정의 Fable 5를 오케스트레이터로 사용했다. 노드를 손으로 배치하는 대신 Claude에게 지시하면 Claude가 노드 그래프 자체를 설계해준다.
- Arcads는 MCP 서버를 공식 제공한다(mcp.arcads.ai) — Claude Desktop이나 Claude Code 같은 에이전트에서 직접 연결해 "명령어로 광고를 만들라"고 시킬 수 있는 구조다.
- "프리셋 포맷에서 시작"이 진입장벽을 낮춘다 — Arcads 홈페이지는 "퍼포먼스 마케터들이 이미 검증한 광고 프리셋을 그대로 쓰라"는 걸 주요 세일즈 포인트로 내세운다.

## 🛠️ 적용법 가이드

1. Arcads 계정 생성 — arcads.ai에서 Google 계정으로 가입. "Studio"(단일 광고)와 "Workflow"(노드 기반 파이프라인) 모드가 분리돼 있다.
2. Workflow 탭 진입 → 새 프로젝트 생성 → 빈 무한 캔버스가 열린다.
3. Assets(제품 이미지) 업로드 — 이 자산이 이후 모든 노드에서 참조하는 기준 소스가 된다.
4. AI 모델 노드 연결 — 영상은 Seedance/Kling/Sora 2 Pro, 이미지는 GPT Image/Nano Banana 등 원하는 생성 모델 노드를 드래그 앤 드롭으로 연결.
5. (선택) Claude를 MCP로 연동해 오케스트레이션 — mcp.arcads.ai를 MCP 서버로 등록하면 대화로 여러 포맷을 한 번에 지시할 수 있다.
6. 프리셋으로 빠르게 시작하고 싶다면 홈페이지의 검증된 광고 포맷 프리셋에서 제품 이미지만 갈아끼운다.
7. 이미 만든 광고를 "9:16 세로형으로 바꿔줘" 같은 자연어 지시로 즉시 리믹스 가능.

## 💼 활용 예시

- 신제품 홍보 소재 대량 제작: 신제품 하나로 UGC 스타일 영상, 인포그래픽형 정적 이미지, SNS 세로형 숏폼을 동시에 뽑아 A/B 테스트용 소재 풀 확보
- 신규 매장/서비스 런칭 캠페인: "체험 후기" 톤의 UGC 영상 + 전후 비교 이미지 광고 + 오픈 이벤트 배너를 한 워크플로우에서 동시 생산
- 마케팅 전담 인력 없이도 상품 사진 한 장으로 여러 광고 포맷 초안을 만들어 반응 좋은 포맷만 골라 디자이너에게 다듬어달라고 요청

## ⚠️ 주의사항

- Arcads는 유료 SaaS다 — 정확한 요금제는 로그인 후 확인이 필요하며, 이 콘텐츠 작성 시점 기준 공식 가격표를 확인하지 못했다.
- 영상에 등장하는 "1,000명 이상의 AI 액터" UGC 스타일 영상은 실존 인물의 얼굴을 학습한 아바타를 쓰는 방식이라, 상업적으로 활용 시 초상권·소비자 오인(표시광고법) 이슈를 반드시 함께 검토해야 한다.
- Claude의 "Fable 5" 모델명은 이 콘텐츠에서 화면에 노출된 UI 문구를 그대로 인용한 것이며, 별도 공식 문서 대조는 하지 않았다.
- MCP 연동(mcp.arcads.ai)은 실제로 살아있는 엔드포인트로 확인됐으나(인증 필요 401 응답 확인), 정확한 연동 설정 방법은 Arcads 공식 문서에서 별도 확인이 필요하다.

## 📚 원본 링크

- Instagram: https://www.instagram.com/reel/DdHDY9Cp2T8/
- 공식 사이트: https://www.arcads.ai
- MCP 엔드포인트(확인됨, 인증 필요): https://mcp.arcads.ai
