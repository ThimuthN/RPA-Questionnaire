import type { Question } from "@/lib/assessment-engine/types";

function choiceQuestion(args: {
  id: string;
  category: string;
  format: "single_select" | "multi_select";
  scoringMethod: "all_or_nothing" | "partial_with_penalty";
  prompt: string;
  options: string[];
  correctAnswer: string[];
  explanation: string;
}): Question {
  return {
    id: args.id,
    roleLevelMin: "SE",
    roleLevelMax: "SE",
    techStack: "Python",
    category: args.category,
    difficulty: 3,
    format: args.format,
    points: 1,
    scoringMethod: args.scoringMethod,
    prompt: args.prompt,
    options: args.options,
    correctAnswer: args.correctAnswer,
    explanation: args.explanation,
    rationale: args.explanation
  } as Question;
}

export function buildSePythonExamQuestions(): Question[] {
  return [
  choiceQuestion({
    id: "se_python_exam_q01",
    category: "Selenium",
    format: "single_select",
    scoringMethod: "all_or_nothing",
    prompt: "You need to wait for a dropdown to be populated with options after an AJAX call before selecting a value. Which is the most reliable approach?",
    options: [
      "Use `time.sleep(3)` then call `Select(element).select_by_value()`",
      "Use `WebDriverWait` with `EC.presence_of_all_elements_located` on the option elements",
      "Click the dropdown immediately and catch the `NoSuchElementException`",
      "Reload the page until the dropdown contains the expected option"
    ],
    correctAnswer: [
      "Use `WebDriverWait` with `EC.presence_of_all_elements_located` on the option elements"
    ],
    explanation: "WebDriverWait with an explicit condition polls the DOM until the options are present, making it reliable regardless of network speed. Fixed sleeps either waste time or fail under load."
  }),
  choiceQuestion({
    id: "se_python_exam_q02",
    category: "Selenium",
    format: "multi_select",
    scoringMethod: "partial_with_penalty",
    prompt: "A Selenium test suite is flaky - tests pass locally but fail intermittently in CI. Which are valid root causes to investigate? Select all that apply.",
    options: [
      "Race conditions where the test interacts with elements before they are ready",
      "Hard-coded `time.sleep()` calls that are too short in CI's slower environment",
      "Selectors tied to dynamic IDs generated fresh on each page load",
      "Using `find_element` instead of `find_elements`",
      "Running the browser in headless mode"
    ],
    correctAnswer: [
      "Race conditions where the test interacts with elements before they are ready",
      "Hard-coded `time.sleep()` calls that are too short in CI's slower environment",
      "Selectors tied to dynamic IDs generated fresh on each page load"
    ],
    explanation: "Race conditions, insufficient sleeps, and dynamic selectors are the three most common causes of CI flakiness. Headless mode and `find_element` vs `find_elements` are not inherently flaky."
  }),
  choiceQuestion({
    id: "se_python_exam_q03",
    category: "Selenium",
    format: "single_select",
    scoringMethod: "all_or_nothing",
    prompt: "A login form submits but the next page never loads during automation. The same credentials work when entered manually. What is the most likely cause?",
    options: [
      "Selenium cannot handle form submissions",
      "The site detects automated browser traffic and blocks the login",
      "The browser version is incompatible with the site",
      "Selenium always clears cookies before each action"
    ],
    correctAnswer: [
      "The site detects automated browser traffic and blocks the login"
    ],
    explanation: "Bot detection (via headers, timing patterns, or navigator properties) is the most common cause when manual login works but automated login fails with identical credentials."
  }),
  choiceQuestion({
    id: "se_python_exam_q04",
    category: "Selenium",
    format: "single_select",
    scoringMethod: "all_or_nothing",
    prompt: "You need to interact with an element inside a nested `iframe` on the page. Your `find_element` call raises `NoSuchElementException`. What must you do first?",
    options: [
      "Use JavaScript `executeScript` to remove the iframe",
      "Switch the WebDriver context into the iframe using `driver.switch_to.frame()`",
      "Use an absolute XPath that includes the iframe tag",
      "Reload the page with a longer implicit wait"
    ],
    correctAnswer: [
      "Switch the WebDriver context into the iframe using `driver.switch_to.frame()`"
    ],
    explanation: "WebDriver cannot reach elements inside an iframe without switching context first. After interacting, switch back with `driver.switch_to.default_content()`."
  }),
  choiceQuestion({
    id: "se_python_exam_q05",
    category: "API automation",
    format: "single_select",
    scoringMethod: "all_or_nothing",
    prompt: "A `requests.post()` call to an external API returns status 200 but the response body contains an `error` field. What is the correct handling approach?",
    options: [
      "Trust the 200 status and continue processing",
      "Raise an exception only if status >= 400 using `response.raise_for_status()`",
      "Parse the response body and check for the `error` field before continuing",
      "Retry the request immediately, as 200 with an error body is a server bug"
    ],
    correctAnswer: [
      "Parse the response body and check for the `error` field before continuing"
    ],
    explanation: "Some APIs return 200 with an error payload (soft errors). Always validate the response body, not just the HTTP status code, before treating a call as successful."
  }),
  choiceQuestion({
    id: "se_python_exam_q06",
    category: "API automation",
    format: "multi_select",
    scoringMethod: "partial_with_penalty",
    prompt: "Which practices improve the reliability and maintainability of a Python API automation script? Select all that apply.",
    options: [
      "Store base URLs, tokens, and timeouts in environment variables or a config file",
      "Set a `timeout` parameter on every `requests` call",
      "Use a single global `requests.Session()` for related calls to reuse connections and headers",
      "Hardcode the Bearer token directly in each request header",
      "Catch broad `Exception` on every call and silently continue"
    ],
    correctAnswer: [
      "Store base URLs, tokens, and timeouts in environment variables or a config file",
      "Set a `timeout` parameter on every `requests` call",
      "Use a single global `requests.Session()` for related calls to reuse connections and headers"
    ],
    explanation: "Externalised config, explicit timeouts (prevents infinite hangs), and Session reuse (shares auth headers and connection pools) are all production-grade practices. Hardcoding tokens is a security risk; silent exception swallowing hides failures."
  }),
  choiceQuestion({
    id: "se_python_exam_q07",
    category: "API automation",
    format: "single_select",
    scoringMethod: "all_or_nothing",
    prompt: "An API endpoint requires OAuth 2.0 Bearer token authentication. The token expires every 60 minutes. What is the best approach for a long-running automation script?",
    options: [
      "Generate a new token once at script start and hardcode its expiry as `time.sleep(3600)`",
      "Check the token expiry before each request and refresh it if it has expired or is close to expiring",
      "Pass credentials with every request instead of using a token",
      "Ignore token expiry and let the API return 401 errors"
    ],
    correctAnswer: [
      "Check the token expiry before each request and refresh it if it has expired or is close to expiring"
    ],
    explanation: "Proactive token refresh before expiry prevents mid-run 401 failures. Checking before each request (or using a buffer like 5 minutes before expiry) is the standard pattern."
  }),
  choiceQuestion({
    id: "se_python_exam_q08",
    category: "API automation",
    format: "single_select",
    scoringMethod: "all_or_nothing",
    prompt: "You are calling a paginated REST API that returns 100 records per page. You need all 1,450 records. What is the correct approach?",
    options: [
      "Make one request with `page_size=1450`",
      "Loop through pages, incrementing the page parameter, until the response returns fewer records than the page size or an empty list",
      "Make 15 parallel requests simultaneously for pages 1 through 15",
      "Request page 1 only and extrapolate the remaining records"
    ],
    correctAnswer: [
      "Loop through pages, incrementing the page parameter, until the response returns fewer records than the page size or an empty list"
    ],
    explanation: "Sequential pagination - incrementing the page until the last partial or empty page - is the reliable pattern. APIs often don't support arbitrary page sizes; parallel requests may violate rate limits or return out-of-order data."
  }),
  choiceQuestion({
    id: "se_python_exam_q09",
    category: "Data extraction",
    format: "single_select",
    scoringMethod: "all_or_nothing",
    prompt: "You scrape product prices from a website daily. After two weeks the script starts returning empty results. The URL and HTML structure appear unchanged. What is the most likely cause?",
    options: [
      "The `requests` library has a two-week cache limit",
      "The site has started serving data via a JavaScript-rendered API call that requires a different endpoint",
      "BeautifulSoup no longer supports the site's HTML version",
      "The product prices have been removed from the site"
    ],
    correctAnswer: [
      "The site has started serving data via a JavaScript-rendered API call that requires a different endpoint"
    ],
    explanation: "Sites frequently migrate static HTML content to dynamic JS-driven API calls. Inspecting the Network tab in DevTools often reveals an XHR/fetch endpoint that can be called directly, bypassing the need for a full browser."
  }),
  choiceQuestion({
    id: "se_python_exam_q10",
    category: "Data extraction",
    format: "multi_select",
    scoringMethod: "partial_with_penalty",
    prompt: "Which are valid techniques for handling JavaScript-rendered content when scraping with Python? Select all that apply.",
    options: [
      "Using Playwright with `page.wait_for_selector()` before reading content",
      "Using Selenium to drive a real browser and extract the rendered DOM",
      "Identifying the underlying XHR/fetch API endpoint in DevTools and calling it directly with `requests`",
      "Increasing the BeautifulSoup parser version",
      "Using `requests-html` with `render()` to execute JavaScript"
    ],
    correctAnswer: [
      "Using Playwright with `page.wait_for_selector()` before reading content",
      "Using Selenium to drive a real browser and extract the rendered DOM",
      "Identifying the underlying XHR/fetch API endpoint in DevTools and calling it directly with `requests`",
      "Using `requests-html` with `render()` to execute JavaScript"
    ],
    explanation: "Playwright, Selenium, direct API calls, and requests-html are all valid. BeautifulSoup is an HTML parser - it has no JavaScript execution capability regardless of version."
  }),
  choiceQuestion({
    id: "se_python_exam_q11",
    category: "Python & code quality",
    format: "single_select",
    scoringMethod: "all_or_nothing",
    prompt: "Review this snippet. What is the primary problem? `def get_users(): conn = db.connect() rows = conn.execute('SELECT * FROM users').fetchall() return rows`",
    options: [
      "The function name should follow camelCase convention",
      "`SELECT *` is invalid SQL syntax",
      "The database connection is never closed, risking connection pool exhaustion",
      "The function should return a generator instead of a list"
    ],
    correctAnswer: [
      "The database connection is never closed, risking connection pool exhaustion"
    ],
    explanation: "Unclosed connections exhaust the DB connection pool over time. The fix is using a context manager: `with db.connect() as conn:` - this guarantees the connection is closed even if an exception is raised."
  }),
  choiceQuestion({
    id: "se_python_exam_q12",
    category: "Python & code quality",
    format: "single_select",
    scoringMethod: "all_or_nothing",
    prompt: "A function that runs 500 browser automation tasks takes 4 hours serially. You need to reduce this to under 30 minutes. What is the most appropriate Python approach?",
    options: [
      "Rewrite the function in a compiled language",
      "Use `concurrent.futures.ThreadPoolExecutor` to run tasks concurrently across multiple threads",
      "Add more `time.sleep()` calls to reduce CPU usage",
      "Chain all 500 tasks into a single long function call"
    ],
    correctAnswer: [
      "Use `concurrent.futures.ThreadPoolExecutor` to run tasks concurrently across multiple threads"
    ],
    explanation: "Browser automation is I/O-bound, not CPU-bound. `ThreadPoolExecutor` allows many tasks to run concurrently while each waits for network/browser responses, dramatically reducing total wall-clock time without the complexity of multiprocessing."
  }),
  choiceQuestion({
    id: "se_python_exam_q13",
    category: "Python & code quality",
    format: "multi_select",
    scoringMethod: "partial_with_penalty",
    prompt: "Which are correct uses of Python context managers (`with` statements) in automation scripts? Select all that apply.",
    options: [
      "Opening and automatically closing a file: `with open('data.csv') as f:`",
      "Managing a database connection that is guaranteed to close on exit or exception",
      "Automatically taking a screenshot when a Selenium test block fails",
      "Replacing all `try/except` blocks in a script",
      "Managing a `requests.Session()` lifecycle"
    ],
    correctAnswer: [
      "Opening and automatically closing a file: `with open('data.csv') as f:`",
      "Managing a database connection that is guaranteed to close on exit or exception",
      "Automatically taking a screenshot when a Selenium test block fails",
      "Managing a `requests.Session()` lifecycle"
    ],
    explanation: "Files, DB connections, custom test fixtures, and Sessions all benefit from context managers. They do not replace `try/except` - they complement it by handling resource cleanup in `__exit__`."
  }),
  choiceQuestion({
    id: "se_python_exam_q14",
    category: "Error handling",
    format: "single_select",
    scoringMethod: "all_or_nothing",
    prompt: "An automation script processes 1,000 records. On record 437 a `StaleElementReferenceException` is raised and the whole script crashes. What is the best structural fix?",
    options: [
      "Wrap the entire 1,000-record loop in a single `try/except` that suppresses all errors",
      "Catch `StaleElementReferenceException` per record, re-locate the element, and retry that record",
      "Skip all records after 437 to avoid the crash",
      "Reduce the batch size to 100 records so fewer records are lost per crash"
    ],
    correctAnswer: [
      "Catch `StaleElementReferenceException` per record, re-locate the element, and retry that record"
    ],
    explanation: "StaleElementReferenceException means the DOM refreshed after the element was found. Re-locating the element within a per-record retry is the correct fix - it isolates failures without discarding successful records."
  }),
  choiceQuestion({
    id: "se_python_exam_q15",
    category: "Error handling",
    format: "single_select",
    scoringMethod: "all_or_nothing",
    prompt: "After deploying a Selenium script to a new server, every run fails with `WebDriverException: Message: 'chromedriver' executable needs to be in PATH`. What is the fastest correct fix?",
    options: [
      "Install Google Chrome on the developer's local machine again",
      "Add `time.sleep(10)` before initialising the driver to allow it to load",
      "Install `webdriver-manager` and use `ChromeDriverManager().install()` to auto-provision the driver",
      "Switch from Chrome to Firefox to avoid the PATH requirement"
    ],
    correctAnswer: [
      "Install `webdriver-manager` and use `ChromeDriverManager().install()` to auto-provision the driver"
    ],
    explanation: "webdriver-manager automatically downloads and caches the correct ChromeDriver binary for the environment, resolving PATH issues without manual setup on each server."
  })
  ];
}
