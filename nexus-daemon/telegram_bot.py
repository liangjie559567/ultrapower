from __future__ import annotations
import logging
from typing import Any

logger = logging.getLogger('nexus.telegram')
AUTO_APPLY_THRESHOLD = 80


def format_improvement_message(imp: dict[str, Any], auto_apply_threshold: int = AUTO_APPLY_THRESHOLD) -> str:
    confidence = imp.get('confidence', 0)
    label = 'AUTO-APPLY' if confidence >= auto_apply_threshold else 'needs review/confirm'
    return (
        f"[{label}] nexus improvement\n"
        f"ID: {imp.get('id', '?')}\n"
        f"Type: {imp.get('type', '?')}\n"
        f"File: {imp.get('targetFile', '?')}\n"
        f"Confidence: {confidence}\n"
        f"Reason: {imp.get('reason', '?')}"
    )


class TelegramBot:
    API_BASE = 'https://api.telegram.org/bot{token}/{method}'

    def __init__(self, token: str, chat_id: str):
        self.enabled = bool(token and chat_id)
        self._token = token
        self._chat_id = chat_id

    async def send_message(self, text: str) -> bool:
        if not self.enabled:
            return False
        try:
            import aiohttp
            url = self.API_BASE.format(token=self._token, method='sendMessage')
            payload = {'chat_id': self._chat_id, 'text': text, 'parse_mode': 'HTML'}
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    if resp.status == 200:
                        logger.info('Telegram message sent')
                        return True
                    logger.warning('Telegram API error: %s', resp.status)
                    return False
        except Exception as e:
            logger.error('Telegram send error: %s', e)
            return False

    async def notify_improvement(self, imp: dict[str, Any]) -> bool:
        msg = format_improvement_message(imp)
        return await self.send_message(msg)
