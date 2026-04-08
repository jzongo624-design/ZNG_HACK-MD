const { GoogleGenerativeAI } = require("@google/generative-ai");

// On récupère la clé API depuis les secrets GitHub
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

let chatAiActive = false; 
const pendingReplies = new Map();

async function iaAutoChat(sock, chatId, message, msgText) {
    // 1. Gestion des commandes d'activation
    if (msgText === '.chat on') {
        chatAiActive = true;
        await sock.sendMessage(chatId, { text: "🤖 *IA Activée*\nJe répondrai après 1 minute de silence de ta part." });
        return;
    }
    if (msgText === '.chat off') {
        chatAiActive = false;
        await sock.sendMessage(chatId, { text: "👤 *IA Désactivée*" });
        return;
    }

    // 2. Logique de réponse (Seulement en privé et si activé)
    if (chatAiActive && !message.key.fromMe && !chatId.endsWith('@g.us')) {
        
        // Si la personne écrit à nouveau, on remet le chrono à zéro
        if (pendingReplies.has(chatId)) {
            clearTimeout(pendingReplies.get(chatId));
        }

        const timer = setTimeout(async () => {
            try {
                // Petit effet "écrit..." pour faire naturel
                await sock.sendPresenceUpdate('composing', chatId);

                const prompt = `Tu es mon assistant. Je suis occupé. Réponds brièvement à : "${msgText}"`;
                const result = await model.generateContent(prompt);
                const response = await result.response;
                
                await sock.sendMessage(chatId, { text: response.text() });
                pendingReplies.delete(chatId);
            } catch (error) {
                console.error("Erreur Gemini:", error);
            }
        }, 60000); // 60 secondes

        pendingReplies.set(chatId, timer);
    }
}

module.exports = { iaAutoChat, pendingReplies };
