# Ahmed Akram - Math 1 Midterm Lab

Open `index.html` in any modern browser for the six timed topic quizzes: Tangent & Normal (15 questions), Derivatives (20), Find y′ (10), Show That / Prove (10), Exact Values (10), and L’Hôpital & Limits (14). Each topic quiz has a 35-minute timer. The comprehensive exam contains 40 selected questions from all six areas and has a one-hour timer.

The scope excludes partial derivatives, integration, and graph-drawing/sketch questions. Hyperbolic, inverse-hyperbolic, and inverse-trigonometric differentiation is included as requested.

## Optional handwritten-work checking

The quiz always accepts an optional image of the written steps for marked multi-step questions. To have those photos read and reviewed after submission, run the included local server with a vision-capable API key:

```powershell
$env:OPENAI_API_KEY = "your_key_here"
node server.mjs
```

Then browse to `http://localhost:4173`. The key remains on your computer and is never placed in the browser code. An attached work image is sent to the configured vision API only after the attempt is submitted, solely to generate the requested feedback. Without the server, quizzes, timers, automatic scoring, final-answer explanations, and image attachment still work; only the AI handwriting-review step is unavailable.
