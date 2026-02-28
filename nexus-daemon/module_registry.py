"""Module registry with circuit breaker protection for nexus-daemon."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Callable

logger = logging.getLogger('nexus.registry')


class CircuitBreaker:
    """Track consecutive failures per module. Blow fuse after max_failures."""

    def __init__(self, max_failures: int = 3):
        self.max_failures = max_failures
        self._failures: dict[str, int] = {}
        self._blown: set[str] = set()

    def record_success(self, module: str) -> None:
        self._failures[module] = 0
        self._blown.discard(module)

    def record_failure(self, module: str) -> None:
        count = self._failures.get(module, 0) + 1
        self._failures[module] = count
        if count >= self.max_failures:
            self._blown.add(module)
            logger.warning('Circuit breaker blown for module: %s', module)

    def is_blown(self, module: str) -> bool:
        return module in self._blown

    def reset(self, module: str) -> None:
        self._failures.pop(module, None)
        self._blown.discard(module)

    def get_status(self) -> dict[str, dict]:
        all_modules = set(self._failures.keys()) | self._blown
        return {
            m: {
                'failures': self._failures.get(m, 0),
                'blown': m in self._blown,
            }
            for m in sorted(all_modules)
        }


class ModuleRegistry:
    """Register and coordinate daemon modules with circuit breaker protection."""

    def __init__(self) -> None:
        self._modules: dict[str, Any] = {}
        self.breaker = CircuitBreaker()

    def register(self, name: str, module: Any) -> None:
        self._modules[name] = module

    def get(self, name: str) -> Any:
        return self._modules.get(name)

    def run_safe(self, name: str, fn: Callable, *args: Any, **kwargs: Any) -> Any:
        """Run fn with circuit breaker protection. Returns None if blown."""
        if self.breaker.is_blown(name):
            logger.warning('Skipping %s: circuit breaker blown', name)
            return None
        try:
            result = fn(*args, **kwargs)
            self.breaker.record_success(name)
            return result
        except Exception as e:
            self.breaker.record_failure(name)
            logger.error('Module %s failed: %s', name, e)
            return None

    async def run_safe_async(self, name: str, coro_fn: Callable, *args: Any, **kwargs: Any) -> Any:
        """Async version of run_safe."""
        if self.breaker.is_blown(name):
            logger.warning('Skipping %s: circuit breaker blown', name)
            return None
        try:
            result = await coro_fn(*args, **kwargs)
            self.breaker.record_success(name)
            return result
        except Exception as e:
            self.breaker.record_failure(name)
            logger.error('Module %s failed: %s', name, e)
            return None

    def get_status(self) -> dict:
        return {
            'modules': sorted(self._modules.keys()),
            'breaker': self.breaker.get_status(),
        }
