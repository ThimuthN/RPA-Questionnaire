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
    roleLevelMin: "Associate",
    roleLevelMax: "Associate",
    techStack: "Python",
    category: args.category,
    difficulty: 2,
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

export function buildAssociateSePythonExamQuestions(): Question[] {
  return [
  choiceQuestion({
    id: "associate_se_python_exam_q01",
    category: "Portal automation",
    format: "single_select",
    scoringMethod: "all_or_nothing",
    prompt: "You are automating a login flow on a web portal using Python. The login button is sometimes slow to appear after page load. What is the best approach?",
    options: [
      "Use `time.sleep(5)` before every click",
      "Use an explicit wait for the element to be clickable before interacting",
      "Refresh the page in a loop until the button appears",
      "Hardcode a 10-second sleep to be safe in all environments"
    ],
    correctAnswer: [
      "Use an explicit wait for the element to be clickable before interacting"
    ],
    explanation: "Explicit waits (e.g. `WebDriverWait`) wait only as long as needed, making the script reliable and fast without burning unnecessary time."
  }),
  choiceQuestion({
    id: "associate_se_python_exam_q02",
    category: "Data extraction",
    format: "single_select",
    scoringMethod: "all_or_nothing",
    prompt: "A Python script scrapes a table from a web page using BeautifulSoup but only returns 50 of 500 rows. What is the most likely cause?",
    options: [
      "BeautifulSoup cannot handle tables larger than 50 rows",
      "The remaining rows are loaded dynamically by JavaScript after the initial page load",
      "The HTML parser library is incorrectly installed",
      "The script ran out of available memory"
    ],
    correctAnswer: [
      "The remaining rows are loaded dynamically by JavaScript after the initial page load"
    ],
    explanation: "Dynamic content rendered by JavaScript is absent from the initial HTML source. A headless browser such as Selenium or Playwright is needed to execute JavaScript and expose the full DOM."
  }),
  choiceQuestion({
    id: "associate_se_python_exam_q03",
    category: "Error handling",
    format: "single_select",
    scoringMethod: "all_or_nothing",
    prompt: "An automation script posts data to a REST API and intermittently receives HTTP 503 responses. What is the best handling strategy?",
    options: [
      "Log the error and terminate the script immediately",
      "Ignore 503 errors and continue to the next record",
      "Implement exponential backoff retry logic for 5xx responses",
      "Switch to a different API endpoint on every 503"
    ],
    correctAnswer: [
      "Implement exponential backoff retry logic for 5xx responses"
    ],
    explanation: "503 is a transient server-unavailable error. Exponential backoff gives the server time to recover between retries without overwhelming it with immediate repeated requests."
  }),
  choiceQuestion({
    id: "associate_se_python_exam_q04",
    category: "Data extraction",
    format: "multi_select",
    scoringMethod: "partial_with_penalty",
    prompt: "Which of the following are valid Python techniques for extracting structured data from a PDF file? Select all that apply.",
    options: [
      "Using `pdfplumber` to extract text and tables",
      "Opening the PDF in a browser and copying text manually",
      "Using `PyMuPDF (fitz)` to read page content programmatically",
      "Using `pytesseract` with a rasterised page image for scanned PDFs",
      "Renaming the `.pdf` file to `.csv`"
    ],
    correctAnswer: [
      "Using `pdfplumber` to extract text and tables",
      "Using `PyMuPDF (fitz)` to read page content programmatically",
      "Using `pytesseract` with a rasterised page image for scanned PDFs"
    ],
    explanation: "pdfplumber, PyMuPDF, and pytesseract (for scanned/image-based PDFs) are all valid Python extraction tools. The choice depends on whether the PDF contains embedded text or is image-only."
  }),
  choiceQuestion({
    id: "associate_se_python_exam_q05",
    category: "Portal automation",
    format: "single_select",
    scoringMethod: "all_or_nothing",
    prompt: "Your Selenium script runs fine locally but fails in CI because the browser version differs. What is the best long-term fix?",
    options: [
      "Pin the exact browser binary version in the CI config and update it manually",
      "Use `webdriver-manager` to automatically match the driver to the installed browser",
      "Run the script without a WebDriver in CI",
      "Disable browser version checks inside the Selenium config"
    ],
    correctAnswer: [
      "Use `webdriver-manager` to automatically match the driver to the installed browser"
    ],
    explanation: "`webdriver-manager` automatically downloads the correct ChromeDriver or GeckoDriver version to match the installed browser, eliminating environment mismatch without manual maintenance."
  }),
  choiceQuestion({
    id: "associate_se_python_exam_q06",
    category: "Workflow design",
    format: "single_select",
    scoringMethod: "all_or_nothing",
    prompt: "An automation pipeline runs 5 sequential steps. Step 3 fails occasionally due to a network timeout. Which design best improves resilience?",
    options: [
      "Re-run the entire pipeline from step 1 on any failure",
      "Skip step 3 silently and proceed to step 4",
      "Add retry logic with a maximum attempt limit specifically at step 3",
      "Run all 5 steps in parallel to avoid the bottleneck"
    ],
    correctAnswer: [
      "Add retry logic with a maximum attempt limit specifically at step 3"
    ],
    explanation: "Targeted retry at step 3 avoids re-doing completed upstream work and keeps the pipeline efficient. Skipping silently risks data loss; running everything in parallel ignores the sequential dependency."
  }),
  choiceQuestion({
    id: "associate_se_python_exam_q07",
    category: "Data handling",
    format: "single_select",
    scoringMethod: "all_or_nothing",
    prompt: "A script loads 10,000 rows from a CSV into a list of dictionaries all at once. Memory usage spikes significantly. What is the best improvement?",
    options: [
      "Increase server RAM",
      "Load the entire file into a string first, then split by newline",
      "Process the file row-by-row using `csv.DictReader` or a generator",
      "Convert the CSV to JSON before processing"
    ],
    correctAnswer: [
      "Process the file row-by-row using `csv.DictReader` or a generator"
    ],
    explanation: "Row-by-row iteration via `csv.DictReader` or a generator keeps peak memory usage constant regardless of file size - only one row exists in memory at a time."
  }),
  choiceQuestion({
    id: "associate_se_python_exam_q08",
    category: "Portal automation",
    format: "multi_select",
    scoringMethod: "partial_with_penalty",
    prompt: "Which practices help make a portal automation script maintainable when the portal UI changes? Select all that apply.",
    options: [
      "Store selectors and URLs in a config file rather than inline in the code",
      "Use descriptive function names that describe the portal action performed",
      "Write all automation logic in a single function for simplicity",
      "Add logging at key steps so failures are easy to trace",
      "Use absolute XPath selectors for every element"
    ],
    correctAnswer: [
      "Store selectors and URLs in a config file rather than inline in the code",
      "Use descriptive function names that describe the portal action performed",
      "Add logging at key steps so failures are easy to trace"
    ],
    explanation: "Externalising selectors, clear function naming, and logging key steps all reduce the cost of updating scripts when the portal UI changes. Absolute XPath breaks with any DOM restructure."
  }),
  choiceQuestion({
    id: "associate_se_python_exam_q09",
    category: "Data extraction",
    format: "single_select",
    scoringMethod: "all_or_nothing",
    prompt: "You need to extract all email addresses from 200 unstructured plain-text files. Which Python approach is most appropriate?",
    options: [
      "Read each file and manually scan for `@` characters",
      "Use the `re` module with an email-matching regex pattern",
      "Import each file into a spreadsheet and filter manually",
      "Use `json.loads()` on each file"
    ],
    correctAnswer: [
      "Use the `re` module with an email-matching regex pattern"
    ],
    explanation: "Regular expressions via the `re` module are the standard tool for pattern-based extraction from unstructured text - concise, fast, and easily testable."
  }),
  choiceQuestion({
    id: "associate_se_python_exam_q10",
    category: "Scheduling & deployment",
    format: "single_select",
    scoringMethod: "all_or_nothing",
    prompt: "An automation script must run every weekday at 8 AM on a Linux server. What is the simplest correct solution?",
    options: [
      "Use an infinite `while` loop with `time.sleep(86400)`",
      "Schedule it using cron with the expression: `0 8 * * 1-5`",
      "Start the script manually each morning",
      "Use `threading.Timer` set to 24 hours"
    ],
    correctAnswer: [
      "Schedule it using cron with the expression: `0 8 * * 1-5`"
    ],
    explanation: "Cron is the standard Linux scheduler. The expression `0 8 * * 1-5` runs the job at 08:00 Monday-Friday. The infinite loop approach wastes a process and won't survive server restarts."
  }),
  choiceQuestion({
    id: "associate_se_python_exam_q11",
    category: "Data handling",
    format: "multi_select",
    scoringMethod: "partial_with_penalty",
    prompt: "Which are valid signs of good data handling in a Python database automation script? Select all that apply.",
    options: [
      "Closing DB connections after use or using context managers (`with`)",
      "Writing all processed output to a single global variable",
      "Validating and sanitising input values before processing",
      "Using parameterised queries instead of string concatenation for SQL",
      "Printing raw database credentials to the console for debugging"
    ],
    correctAnswer: [
      "Closing DB connections after use or using context managers (`with`)",
      "Validating and sanitising input values before processing",
      "Using parameterised queries instead of string concatenation for SQL"
    ],
    explanation: "Context managers, input validation, and parameterised queries are core safe data handling practices. String-concatenated SQL is vulnerable to injection; logging credentials is a security risk."
  }),
  choiceQuestion({
    id: "associate_se_python_exam_q12",
    category: "Workflow design",
    format: "single_select",
    scoringMethod: "all_or_nothing",
    prompt: "A 200-line Python function downloads a report, parses it, and uploads results to a portal. A new requirement changes the upload format. What is the best structural step before making the change?",
    options: [
      "Add the new upload logic at the bottom of the existing function",
      "Copy the entire function and modify the copy for the new format",
      "Refactor into three focused functions - download, parse, upload - then modify only upload",
      "Rewrite the entire script from scratch to accommodate the change"
    ],
    correctAnswer: [
      "Refactor into three focused functions - download, parse, upload - then modify only upload"
    ],
    explanation: "Separating concerns into focused functions means a format change only touches the upload function, reducing risk and making each part independently testable."
  })
  ];
}
