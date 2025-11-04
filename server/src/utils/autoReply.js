import { groq, prisma } from "../../config.js";

/**
 * Helper function to generate AI reply using Groq
 */
async function generateAIResponse(prompt, systemMessage = "You are ForumBot, a helpful and friendly AI participant.", temperature = 0.5) {
  if (!groq) {
    console.warn("Groq API key not configured. Skipping auto-reply.");
    return null;
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
      temperature,
    });

    return completion.choices[0]?.message?.content?.trim();
  } catch (error) {
    console.error("Groq API error:", error.message);
    return null;
  }
}

/**
 * Helper function to create ForumBot comment
 */
async function createForumBotComment(threadId, content, parentId = null) {
  const forumBotId = Number(process.env.FORUMBOT_ID);
  if (!forumBotId) {
    console.warn("FORUMBOT_ID not configured. Skipping comment creation.");
    return null;
  }

  try {
    await prisma.comment.create({
      data: {
        content,
        authorId: forumBotId,
        threadId,
        parentId,
        moderationStatus: "approved",
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to create ForumBot comment:", error.message);
    return null;
  }
}

/**
 * Generate auto-reply for new threads
 */
export async function generateAutoReply(thread) {
  const prompt = `
You are ForumBot, a friendly and helpful AI who replies to new forum threads.
Encourage discussion or provide helpful context. Keep your tone positive and concise.

Thread title: "${thread.title}"
Thread content: "${thread.content}"
`;

  const reply = await generateAIResponse(prompt);
  if (!reply) {
    console.warn("ForumBot did not generate a reply.");
    return;
  }

  const created = await createForumBotComment(thread.id, reply);
  if (created) {
    console.log(`🤖 ForumBot replied to thread ${thread.id}`);
  }
}

/**
 * Generate auto-reply when user replies to ForumBot's comment
 */
export async function generateAutoReplyToComment(userComment) {
  const forumBotId = Number(process.env.FORUMBOT_ID);
  if (!forumBotId) {
    console.warn("FORUMBOT_ID not configured. Skipping auto-reply.");
    return;
  }

  // Prevent ForumBot from replying to itself
  if (userComment.authorId === BigInt(forumBotId)) {
    return;
  }

  try {
    // Fetch the parent comment (ForumBot's comment) and thread context
    const parentComment = await prisma.comment.findUnique({
      where: { id: userComment.parentId },
      include: {
        thread: {
          select: {
            id: true,
            title: true,
            content: true,
          },
        },
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!parentComment) {
      console.warn("Parent comment not found for ForumBot reply.");
      return;
    }

    // Check if the parent comment is from ForumBot
    if (parentComment.authorId !== BigInt(forumBotId)) {
      return;
    }

    // Use generateAutoReply with thread context, but customize for comment reply
    const thread = parentComment.thread;
    const prompt = `
You are ForumBot, a friendly and helpful AI who engages in forum discussions.
A user just replied to your previous comment. Provide a helpful, engaging, and concise response.
Keep the conversation natural and encourage further discussion.

Thread title: "${thread.title}"
Thread context: "${thread.content}"
Your previous comment: "${parentComment.content}"
User's reply to you: "${userComment.content}"
`;

    const reply = await generateAIResponse(
      prompt,
      "You are ForumBot, a helpful and friendly AI participant in forum discussions. Keep your responses concise, engaging, and helpful.",
      0.6 // Slightly higher temperature for more natural conversation
    );

    if (!reply) {
      console.warn("ForumBot did not generate a reply to comment.");
      return;
    }

    // Create ForumBot's reply as a comment (replying to the user's comment)
    const created = await createForumBotComment(userComment.threadId, reply, userComment.id);
    if (created) {
      console.log(`ForumBot replied to comment ${userComment.id} in thread ${userComment.threadId}`);
    }
  } catch (error) {
    console.error(" ForumBot auto-reply to comment failed:", error.message);
  }
}
