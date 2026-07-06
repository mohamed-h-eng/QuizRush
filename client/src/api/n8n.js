// Calls the n8n webhook directly from the browser (not proxied through our
// backend) so file uploads go straight from the user's device to n8n.
// The webhook is expected to run AI-based extraction/formatting and respond
// with quiz JSON in the same shape our backend already validates:
//   { title, topic, description?, isPublic?, questions: [...] }
// or  { quizzes: [ <quiz>, <quiz>, ... ] }

const WEBHOOK_URL = import.meta.env.VITE_N8N_QUIZ_WEBHOOK_URL;
const AUTH_HEADER = import.meta.env.VITE_N8N_WEBHOOK_AUTH_HEADER;
const AUTH_VALUE = import.meta.env.VITE_N8N_WEBHOOK_AUTH_VALUE;

const DEFAULT_TIMEOUT_MS = 90_000; // AI extraction/formatting can take a while

/**
 * Sends files and/or raw pasted text to the n8n webhook and returns the
 * parsed JSON quiz draft(s) it responds with.
 *
 * @param {{ files: File[], rawText: string, topicHint: string }} input
 */
export async function generateQuizDraft({ files = [], rawText = "", topicHint = "" }) {
  if (!WEBHOOK_URL) {
    throw new Error(
      "n8n webhook URL is not configured. Set VITE_N8N_QUIZ_WEBHOOK_URL in client/.env"
    );
  }

  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (rawText.trim()) formData.append("rawText", rawText.trim());
  if (topicHint.trim()) formData.append("topicHint", topicHint.trim());

  const headers = {};
  if (AUTH_HEADER && AUTH_VALUE) headers[AUTH_HEADER] = AUTH_VALUE;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(WEBHOOK_URL, {
      method: "POST",
      body: formData,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Quiz generation timed out. Try a smaller file or shorter text.");
    }
    throw new Error("Could not reach the n8n webhook. Check the URL and your network.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`n8n webhook returned an error (${response.status}): ${text.slice(0, 200)}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error("n8n webhook did not return valid JSON.");
  }

  return data;
}
