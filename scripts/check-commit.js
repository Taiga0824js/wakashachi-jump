import fs from "fs";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const commitMsgFile = process.argv[2];
if (!commitMsgFile) {
    console.error("🚨 エラー: コミットメッセージのファイルパスが渡されていません！");
    process.exit(1);
}

const commitMessage = fs.readFileSync(commitMsgFile, "utf8").trim();

console.log(`🔍 AIに判定依頼: 「${commitMessage}」`);

const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
        { role: "system", content: "あなたはGitのコミットメッセージを評価するAIです。適切なら「OK」、不適切なら「NG」とだけ返答してください。" },
        { role: "user", content: `このコミットメッセージは適切ですか？: "${commitMessage}"` }
    ]
});

const aiDecision = response.choices[0].message.content.trim();

if (aiDecision === "NG") {
    console.error("🚨 AI判定: コミットメッセージが不適切です！やり直してください。");
    process.exit(1);
}

console.log("✅ AI判定: コミットメッセージOK！");
process.exit(0);
