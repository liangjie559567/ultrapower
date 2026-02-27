import pytest
from unittest.mock import patch, AsyncMock, MagicMock
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from telegram_bot import TelegramBot, format_improvement_message

class TestFormatImprovementMessage:
    def test_includes_id_and_confidence(self):
        imp = {
            'id': 'imp-001',
            'confidence': 85,
            'type': 'skill_update',
            'targetFile': 'skills/learner/SKILL.md',
            'reason': 'test reason',
        }
        msg = format_improvement_message(imp)
        assert 'imp-001' in msg
        assert '85' in msg
        assert 'skill_update' in msg

    def test_includes_auto_apply_label_when_high_confidence(self):
        imp = {
            'id': 'imp-002',
            'confidence': 90,
            'type': 'skill_update',
            'targetFile': 'skills/test/SKILL.md',
            'reason': 'high confidence',
        }
        msg = format_improvement_message(imp)
        assert 'AUTO' in msg or 'auto' in msg.lower()

    def test_includes_review_label_when_low_confidence(self):
        imp = {
            'id': 'imp-003',
            'confidence': 60,
            'type': 'hook_update',
            'targetFile': 'src/hooks/test.ts',
            'reason': 'low confidence',
        }
        msg = format_improvement_message(imp)
        assert 'review' in msg.lower() or 'confirm' in msg.lower()

class TestTelegramBot:
    def test_init_disabled_when_no_token(self):
        bot = TelegramBot(token='', chat_id='')
        assert not bot.enabled

    def test_init_enabled_when_token_provided(self):
        bot = TelegramBot(token='test-token', chat_id='12345')
        assert bot.enabled

    @pytest.mark.asyncio
    async def test_send_message_returns_false_when_disabled(self):
        bot = TelegramBot(token='', chat_id='')
        result = await bot.send_message('test')
        assert result is False
