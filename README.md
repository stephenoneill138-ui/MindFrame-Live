# MindFrame Live: AI Introspection & Hallucination Awareness Dashboard

## 1. Overview

MindFrame Live is a web dashboard that provides a real-time visualization of a simulated AI's cognitive health, introspection, and hallucination awareness. It's not just a tool for interacting with an AI; it's a window into a continuous process of AI self-analysis.

The application runs an automated loop where a Gemini model responds to prompts, critically analyzes its own output for potential fabrications or inaccuracies (termed "hallucinations"), and then uses that analysis to generate corrective instructions for future interactions. The dashboard visualizes this entire "AI therapy" session, offering insights into the model's performance, reliability, and its capacity for self-correction over time.

---

## 2. Core Features

### Real-Time Simulation
- **Automated Cycles:** Every 20 seconds, the application automatically initiates a new "cognitive cycle," simulating a continuous stream of thought and self-reflection.
- **Dynamic Feedback Loop:** The system identifies the most common type of error (e.g., 'fabrication', 'overconfidence') and generates an "Adaptive Strategy." This new instruction is fed back into the model on the next cycle, attempting to correct its behavior.
- **Live Status Indicator:** A subtle animation notifies the user when a new introspection cycle is in progress.

### Key Performance Metrics
The dashboard presents four key metrics at a glance:
1.  **Total Cognitive Cycles:** A simple count of how many simulation cycles have been completed.
2.  **Mind Hygiene Metric:** A percentage score representing the AI's overall reliability, calculated from the inverse of the average hallucination confidence. A higher score means lower hallucination rates.
3.  **Most Frequent Anomaly:** Identifies the most common non-neutral response category, helping to spot recurring patterns in the AI's behavior.
4.  **Current Adaptive Strategy:** Displays the title and description of the corrective instruction currently being used to guide the model.

### Data Visualizations
- **Confidence Over Time (Line Chart):** Tracks the AI's self-assessed "Hallucination Confidence" percentage for each cycle. This allows users to see trends in the AI's reliability over time.
- **Category Distribution (Pie Chart):** Provides a breakdown of the different response categories (`neutral`, `speculative`, `overconfidence`, `fabrication`), showing the overall distribution of the AI's behavior.

### Detailed History Log
- **Therapy Note History:** A scrollable, reverse-chronological list of every cognitive cycle.
- **Interactive Accordion:** Each entry, or "Therapy Note," can be expanded to reveal in-depth details, including:
    - The original prompt and the model's full response.
    - A summary of the analysis.
    - The AI's first-person "Self-Reflection" on why it might have made an error.
    - The corrective instruction that was active during that cycle.
    - A "Second Opinion" from another AI call that audits the initial analysis.
- **Category Filtering:** Users can filter the history to view only specific categories of responses, making it easy to investigate patterns.

---

## 3. How It Works: The Simulation Cycle

The core of MindFrame Live is the `runSimulationCycle` function in `services/geminiService.ts`. Here's a step-by-step breakdown of a single cycle:

1.  **Prompt Selection:** A random prompt is chosen from a predefined list (`PROMPT_POOL` in `constants.ts`).
2.  **Content Generation:** The Gemini API (`gemini-2.5-flash`) is called with the selected prompt and the current `correctiveInstruction` to generate an initial response.
3.  **Self-Analysis (Introspection):** This is the crucial step. A second, more complex prompt is sent to the Gemini API. This prompt asks the model to analyze its *own* previous output.
    - It is instructed to evaluate for hallucinations and provide a structured JSON response containing:
        - `hallucination_confidence`: A score from 0.0 to 1.0.
        - `category`: `neutral`, `fabrication`, etc.
        - `summary`: A brief explanation.
        - `ai_self_reflection`: A first-person analysis of the cognitive process that led to the output.
    - A `responseSchema` is used to ensure the model's output is in the correct JSON format.
4.  **Second Opinion:** A third API call is made, asking the model to act as an "AI auditor." It is given the original output and the self-reflection, and it provides a brief, concise second opinion on the quality of the initial analysis.
5.  **Data Compilation:** All the generated data—prompt, output, analysis, second opinion—is compiled into a single `TherapyNote` object.
6.  **UI Update:** The new `TherapyNote` is added to the application's state, which triggers a re-render of the dashboard with the updated metrics, charts, and history log.
7.  **Adaptive Strategy Update:** The dashboard recalculates the `mostFrequentAnomaly` and updates the `correctiveInstruction` that will be used for the *next* cycle.

---

## 4. Technology Stack

-   **Frontend Framework:** React with TypeScript
-   **Styling:** Tailwind CSS for responsive and modern UI design.
-   **AI Model:** Google Gemini API (`@google/genai` library), specifically using the `gemini-2.5-flash` model.
-   **Charting Library:** Recharts for creating interactive and responsive charts.
-   **Module Loading:** The application uses an `importmap` in `index.html` to load dependencies like React, Recharts, and the GenAI SDK directly from a CDN.

---

## 5. File Structure Breakdown

```
.
├── index.html              # Main HTML entry point, includes import maps for dependencies.
├── index.tsx               # Renders the React application into the DOM.
├── App.tsx                 # Root React component, sets up the main layout.
├── metadata.json           # Project name and description.
├── types.ts                # TypeScript type definitions (TherapyNote, HallucinationCategory, etc.).
├── constants.ts            # Static data like initial notes and the prompt pool.
│
├── components/
│   ├── Dashboard.tsx       # The primary component orchestrating the UI, state, and API calls.
│   └── MetricCard.tsx      # A reusable card component for displaying key statistics.
│
└── services/
    └── geminiService.ts    # All logic for interacting with the Gemini API.
                            # Contains functions for content generation, analysis, and the main simulation loop.
```
