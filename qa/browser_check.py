import http.server, threading, functools
from playwright.sync_api import sync_playwright
server = http.server.ThreadingHTTPServer(('127.0.0.1', 8000), functools.partial(http.server.SimpleHTTPRequestHandler, directory='/workspace/hangman'))
threading.Thread(target=server.serve_forever, daemon=True).start()
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':440,'height':956},device_scale_factor=1,is_mobile=True,has_touch=True)
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto('http://127.0.0.1:8000')
    page.screenshot(path='/workspace/hangman/qa/welcome.png',full_page=True)
    page.fill('#p1','Drew');page.fill('#p2','Sam');page.click('#names button')
    page.fill('#answer','Café, 2!');page.select_option('#category','Food & drink');page.click('#answer-form button')
    assert 'Café' not in page.locator('main').inner_text()
    page.reload();assert page.locator('#ready').count()==1
    page.click('#ready')
    page.click('[data-key="C"]');page.reload()
    assert page.locator('[data-key="C"]').is_disabled()
    for key in 'AFE':page.click(f'[data-key="{key}"]')
    assert 'You got it, Sam!' in page.locator('main').inner_text()
    assert page.locator('.player strong').all_text_contents()==['0','1']
    page.reload();assert page.locator('.player strong').all_text_contents()==['0','1']
    page.click('#next');page.fill('#answer','Z');page.select_option('#category','Other');page.fill('#custom','A letter');page.click('#answer-form button');page.click('#ready')
    for key in 'ABCDEF':page.click(f'[data-key="{key}"]')
    assert 'That’s six' in page.locator('main').inner_text()
    assert page.locator('.player strong').all_text_contents()==['0','1']
    page.click('#next');page.fill('#answer','A little friendly rivalry');page.select_option('#category','Other');page.fill('#custom','An excellent category');page.click('#answer-form button');page.click('#ready');page.click('[data-key="E"]');page.click('[data-key="Z"]')
    page.screenshot(path='/workspace/hangman/qa/game.png',full_page=True)
    for width in [320,375,440]:
        page.set_viewport_size({'width':width,'height':956})
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), f'Overflow at {width}'
    page.click('#new-session');page.get_by_role('button',name='Keep playing').click();assert page.locator('.keyboard').count()==1
    page.click('#new-session');page.locator('#confirm button[value="confirm"]').click();page.locator('#names').wait_for()
    page.reload();assert page.locator('#names').count()==1
    assert not errors, errors
    browser.close()
server.shutdown()
print('PASS: mobile flows, solve/loss scores, refresh recovery, handoff, role swaps, custom categories, 320/375/440px layout, new session; no browser errors.')
