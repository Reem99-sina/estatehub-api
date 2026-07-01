const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateAIReview(propertyText: any) {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: propertyText,
  });

  const embedding = response.data[0].embedding;
  return embedding;
}
