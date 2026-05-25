#!/bin/bash
# Clawd ONESHOT gate 测试脚本
# 用法:
#   bash test-oneshot-gate.sh               # 全测 5 个状态，间隔 6s
#   bash test-oneshot-gate.sh error         # 只测 error
#   bash test-oneshot-gate.sh notification
#   bash test-oneshot-gate.sh sweeping
#   bash test-oneshot-gate.sh attention
#   bash test-oneshot-gate.sh carrying
#   bash test-oneshot-gate.sh all 10        # 全测，间隔 10s
#
# 测试场景:
#   1) Animation Map 里把对应行开关关掉 → 跑脚本 → 桌宠应不出对应动画（gate 生效）
#   2) 再把开关打开 → 跑脚本 → 桌宠应恢复播放对应动画（反向验证）

STATE=${1:-all}
DELAY=${2:-6}
AGENT=${3:-claude-code}
URL="http://127.0.0.1:23333/state"

# state → event 映射（对应 agents/claude-code.js 的事件名）
get_event() {
  case $1 in
    error)        echo "PostToolUseFailure" ;;
    notification) echo "Notification" ;;
    sweeping)     echo "PreCompact" ;;
    attention)    echo "Stop" ;;
    carrying)     echo "WorktreeCreate" ;;
    *) echo "" ;;
  esac
}

send_state() {
  local state=$1
  local event=$(get_event "$state")
  local sid="test-${state}-$(date +%s)"
  local payload="{\"state\":\"$state\",\"event\":\"$event\",\"session_id\":\"$sid\",\"agent_id\":\"$AGENT\"}"
  printf "→ [%-13s] event=%-20s " "$state" "$event"
  curl -s -X POST "$URL" -H "Content-Type: application/json" -d "$payload" -w "HTTP %{http_code}\n"
}

# 健康检查
if ! curl -s "$URL" | grep -q '"ok":true'; then
  echo "✗ Clawd 服务未运行（预期 127.0.0.1:23333）。先 npm start"
  exit 1
fi

if [ "$STATE" = "all" ]; then
  echo "=== Clawd ONESHOT gate 全测：5 个状态，间隔 ${DELAY}s ==="
  for s in error notification sweeping attention carrying; do
    send_state "$s"
    sleep "$DELAY"
  done
  echo "=== 完成 ==="
else
  event=$(get_event "$STATE")
  if [ -z "$event" ]; then
    echo "✗ 未知 state: $STATE"
    echo "  有效值: error | notification | sweeping | attention | carrying | all"
    exit 1
  fi
  send_state "$STATE"
fi
