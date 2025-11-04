import { groq, prisma } from "../../config.js";

export async function generateAutoReply(thread) {
  if (!groq) {
    console.warn("Groq API key not configured. Skipping auto-reply.");
    return;
  }

  try {
    const prompt = `
You are ForumBot, a friendly and helpful AI who replies to new forum threads.
Encourage discussion or provide helpful context. Keep your tone positive and concise.

Thread title: "${thread.title}"
Thread content: "${thread.content}"
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // fast and high-quality
      messages: [
        { role: "system", content: "You are ForumBot, a helpful and friendly AI participant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.5,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) {
      console.warn("⚠️ ForumBot did not generate a reply.");
      return;
    }

    // Save the AI reply as a comment
    await prisma.comment.create({
      data: {
        content: reply,
        authorId: Number(process.env.FORUMBOT_ID),
        threadId: thread.id,
        moderationStatus: "approved",
      },
    });

    console.log(`🤖 ForumBot replied to thread ${thread.id}`);
  } catch (error) {
    console.error("❌ ForumBot auto-reply failed:", error.message);
  }
}
