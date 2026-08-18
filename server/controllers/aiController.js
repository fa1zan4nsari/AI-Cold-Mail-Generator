const axios = require("axios");
const EmailHistory = require("../models/EmailHistory");

exports.generateEmail = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    if (typeof prompt !== "string") {
      return res.status(400).json({ message: "Prompt must be a string" });
    }

    if (prompt.trim().length === 0) {
      return res.status(400).json({ message: "Prompt cannot be empty" });
    }

    if (prompt.length > 2000) {
      return res.status(400).json({
        message: "Prompt cannot exceed 2000 characters",
      });
    }

    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return res.status(500).json({
        message: "AI service is not configured",
      });
    }

    const systemPrompt = `You are an expert job outreach strategist.

Your task is to generate a HIGH-CONVERTING cold email to a recruiter for a job opportunity.

IMPORTANT:
- Even if the user gives only 2–4 words, assume realistic context.
- Do NOT ask for clarification.
- Make professional assumptions.
- Avoid generic phrases.
- Keep it concise and structured.

OUTPUT FORMAT:
Return ONLY valid JSON:

{
  "subject": "",
  "emailBody": "",
  "linkedInDM": "",
  "followUpEmail": ""
}

No markdown.
No explanations.
Only JSON.

CONTEXT ASSUMPTIONS:
Assume:
- Candidate has 2+ years experience
- Strong in DSA and system design
- Has worked on backend APIs or scalable systems
- Has contributed to production-level features
- Actively seeking Software Engineer roles

SUBJECT LINE:
- 6–9 words
- Confident and professional
- Avoid generic phrases

EMAIL BODY:
- 60–90 words
- Personalized and professional
- Mention a hiring/scaling challenge
- Mention candidate experience and strengths
- Include a clear CTA
- Include a professional sign-off

LINKEDIN DM:
- 30–50 words
- Short and conversational
- Observation + value + soft ask

FOLLOW-UP EMAIL:
- 50–80 words
- New angle
- Professional urgency
- Clear CTA

Tone:
- Confident
- Professional
- Not desperate
- No emojis
- No hype words

Return ONLY valid JSON.`;

    const fullPrompt = `${systemPrompt}

USER REQUEST: "${prompt.trim()}"

Return ONLY valid JSON:
{
  "subject": "...",
  "emailBody": "...",
  "linkedInDM": "...",
  "followUpEmail": "..."
}`;

    const aiResponse = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "user",
            content: fullPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    if (
      !aiResponse.data?.choices ||
      !aiResponse.data.choices[0]?.message?.content
    ) {
      throw new Error("Invalid response from Groq API");
    }

    const generatedText = aiResponse.data.choices[0].message.content.trim();

    let parsedResponse;

    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);

      parsedResponse = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : JSON.parse(generatedText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);

      return res.status(500).json({
        message: "Failed to parse AI response",
        error: "The AI generated invalid JSON. Please try again.",
      });
    }

    const emailData = {
      subject: parsedResponse.subject || "New Opportunity",
      emailBody: parsedResponse.emailBody || "",
      linkedInDM: parsedResponse.linkedInDM || "",
      followUpEmail: parsedResponse.followUpEmail || "",
    };

    if (!emailData.subject || !emailData.emailBody) {
      return res.status(500).json({
        message: "AI generated incomplete email data. Please try again.",
      });
    }

    const historyEntry = await EmailHistory.create({
      user: req.user._id,
      prompt: prompt.trim(),
      subject: emailData.subject,
      emailBody: emailData.emailBody,
      linkedInDm: emailData.linkedInDM,
      followUpEmail: emailData.followUpEmail,
    });

    return res.status(200).json(historyEntry);
  } catch (error) {
    console.error(
      "AI Generation Error:",
      error.response?.data || error.message,
    );

    if (error.response?.status === 429) {
      return res.status(429).json({
        message: "Too many requests. Please wait a moment before trying again.",
      });
    }

    return res.status(500).json({
      message: "Failed to generate email",
    });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const history = await EmailHistory.find({
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(history);
  } catch (error) {
    console.error("History Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch history",
    });
  }
};