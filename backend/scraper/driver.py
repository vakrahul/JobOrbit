import time
import logging
from contextlib import contextmanager

logger = logging.getLogger(__name__)

def get_chrome_driver(headless: bool = True):
    """
    Initializes a Chrome WebDriver with anti-detection capabilities.
    First attempts undetected_chromedriver; if unavailable,
    falls back cleanly to standard Selenium with stealth options.
    """
    # Attempt 1: undetected_chromedriver
    try:
        import undetected_chromedriver as uc
        options = uc.ChromeOptions()
        if headless:
            options.add_argument('--headless=new')
        options.add_argument('--disable-gpu')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--window-size=1920,1080')
        options.add_argument('--log-level=3')
        
        # Suppress handle invalid errors on Windows cleanup
        driver = uc.Chrome(options=options, use_subprocess=True)
        logger.info("Initialized undetected_chromedriver successfully")
        return driver
    except Exception as e:
        logger.warning(f"undetected_chromedriver initialization fallback: {e}")

    # Attempt 2: standard selenium with stealth arguments
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        options = Options()
        if headless:
            options.add_argument('--headless=new')
        options.add_argument('--disable-gpu')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--window-size=1920,1080')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        driver = webdriver.Chrome(options=options)
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        logger.info("Initialized standard Selenium Chrome with stealth options")
        return driver
    except Exception as e2:
        logger.error(f"Failed to initialize standard Selenium Chrome: {e2}")
        raise RuntimeError(f"Could not initialize any Chrome driver: {e2}")

@contextmanager
def browser_session(headless: bool = True):
    """
    Context manager for safe browser session lifecycle.
    """
    driver = get_chrome_driver(headless=headless)
    try:
        yield driver
    finally:
        try:
            driver.close()
        except Exception:
            pass
        try:
            driver.quit()
        except Exception:
            pass

class BrowserScraper:
    """
    Reusable browser driver instance for batch scraping.
    Reuses a single browser session instead of launching Chrome repeatedly.
    """
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.driver = None

    def start(self):
        if not self.driver:
            self.driver = get_chrome_driver(headless=self.headless)

    def fetch_html(self, url: str, delay: float = 1.5) -> str:
        if not self.driver:
            self.start()
        self.driver.get(url)
        time.sleep(delay)
        return self.driver.page_source

    def stop(self):
        if self.driver:
            try:
                self.driver.quit()
            except Exception:
                pass
            self.driver = None

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stop()
