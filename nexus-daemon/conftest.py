# Disable pytest_postgresql plugin (requires libpq which is not available on this system)
collect_ignore_glob = []

def pytest_configure(config):
    config.pluginmanager.set_blocked("postgresql")
